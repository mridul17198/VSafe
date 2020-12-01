var express = require('express');
var router = express.Router();
var passport = require('passport');
const bodyParser = require('body-parser');
var User = require('../models/user');
var authenticate = require('../authenticate');
router.use(bodyParser.json());

const config=require('../config');
const { Client } = require('twilio/lib/twiml/VoiceResponse');

const client=require('twilio')(process.env.ACCOUNT_SID || config.accountSID , process.env.AUTH_TOKEN || config.authToken);

/* GET users listing. */
router.get('/',authenticate.verifyUser,function(req, res, next) {
  User.find({},(err,user)=>{
    if(err)
    {
      res.statusCode=500;
      res.setHeader('Content-type','application/json');
      res.json({err:err});
    }
    else{
      res.statusCode=200;
      res.setHeader('Content-type','application/json');
      data={
        username:user.username,
        phonenumber:user.phonenumber,
        emergencyContact1:user.emergencyContact1,
        emergencyContact2:user.emergencyContact2,
        emergencyContact3:user.emergencyContact3
      }
      res.json({success:true,data:data,status:'List Of User Fetched'})
    }
  })
});

/*This is for Registration*/

router.post('/signup', (req, res, next) => {
  User.register(new User({username: req.body.username,phonenumber:req.body.phonenumber,emergencyContact1:req.body.emergencyContact1,emergencyContact2:req.body.emergencyContact2,emergencyContact3:req.body.emergencyContact3}), 
    req.body.password, (err, user) => {
    if(err) {  
      err={
        success:"false",
        message:"User With Given Username or PhoneNumber Already Exist"
      }
      res.statusCode=500;
      res.setHeader('Content-type','application/json');
      res.json({err:err});
    }
    else {
      passport.authenticate('local',{failureRedirect: '/user/registration_error'})(req, res, () => {
        var token = authenticate.getToken({_id: req.user._id});
        sendOpt(req.body.phonenumber,req.body.channel)
        .then((data)=>{
          res.statusCode=200;
          res.setHeader('Content-type','application/json');
          res.json({success:true,token:token,data:data,status:'Registration Successfull',sendStatus:'Code successfully Send'})
        })
        .catch((err)=>{
          res.statusCode=500;
          res.setHeader('Content-type','application/json');
          res.json({err:err});
        })
      });
    }
  });
});
/* This is for logging */
router.post('/login',passport.authenticate('local',{failureRedirect: '/users/login_error'}), (req, res) => {
  var token = authenticate.getToken({_id: req.user._id});
  if(req.user.verify)
  {
    data={
      username:req.user.username,
      phonenumber:req.user.phonenumber,
      emergencyContact1:req.user.emergencyContact1,
      emergencyContact2:req.user.emergencyContact2,
      emergencyContact3:req.user.emergencyContact3
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true,data:data,token:token,status: 'You are successfully logged in!'});
  }
  else{
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    err={
      success:"false",
      message:"Please Verify the Otp"
    }
    res.json({err:err});
  }
});

router.post('/updateContact',authenticate.verifyUser,(req,res,next)=>{
  User.update({username:req.body.Username},{emergencyContact1:req.body.EmergencyContact1,emergencyContact2:req.body.EmergencyContact2,
  emergencyContact3:req.body.EmergencyContact3},(err,user)=>{
    if(err)
    {
      res.statusCode=500
      res.setHeader('Content-Type','application/json');
      res.json(({err:err}))
    }
    else{
      res.statusCode=200;
      res.setHeader('Content-Type','application/json');
      res.json({success: true,data:user,status:'Contact successfully Updated!'})
    }
  })
})

router.post('/resetPassword',(req,res,next)=>{
  User.findOne({phonenumber:req.body.phonenumber},(err,user)=>{
    if(user)
    {
      user.changePassword(req.body.oldPassword,req.body.newPassword,(err,user)=>{
        if(err)
        {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          err={
            success:"false",
            message:"Password Not Changed Successfully"
          }
          res.json({err:err});
        }
        else{
          data={
            username:user.username,
            phonenumber:user.phonenumber,
            emergencyContact1:user.emergencyContact1,
            emergencyContact2:user.emergencyContact2,
            emergencyContact3:user.emergencyContact3
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true,data:data,status: 'Password Successfully Changed'});
        }
      })
    }
    else{
      next(err);
    }
})
})

router.post('/sendOTP',(req,res)=>{
  sendOpt(req.body.mobile_number,req.body.channel)
         .then((data)=>{
          res.statusCode=200;
          res.setHeader('Content-type','application/json');
          res.json({success:true,data:data,status:'Code successfully Send'})
         },(err)=>{
          res.statusCode=500;
          res.setHeader('Content-type','application/json');
          res.json({err:err});
         })
         .catch((err)=>{
          res.statusCode=500;
          res.setHeader('Content-type','application/json');
          res.json({err:err});
         })
})

sendOpt=(phonenumber,channel)=>{
  return client
              .verify
              .services(process.env.SERVICE_ID || config.serviceID)
              .verifications
              .create({
                to:`+91${phonenumber}`,
                channel:channel
              })
}

/*This is for otp verification*/

router.post('/optVerify',(req,res)=>{
  client
       .verify
       .services(process.env.SERVICE_ID || config.serviceID)
       .verificationChecks
       .create({
         to:`+91${req.body.phone_number}`,
         code:req.body.code
       })
       .then((data)=>{
        if(data.valid)
        {
          User.update({phonenumber:req.body.phone_number},{verify:"true"},(err,user)=>{
            if(err)
            {
              res.statusCode=500
              res.setHeader('Content-Type','application/json');
              res.json(({err:err}))
            }
            else
            {
              res.statusCode=200;
              res.setHeader('Content-Type','application/json');
              res.json({success: true,data:user,status: 'Code successfully Verified!'})
            }
          })
        }
        else{
          res.statusCode=500;
          res.setHeader('Content-Type', 'application/json');
          err={
            success:"false",
            message:"Opt is Wrong!!!! Please Try Again"
          }
          res.json({err:err});
        }
       })

})
// This is called when user is not authenticated

router.get('/login_error',(req,res) =>{
  res.statusCode=500;
  res.setHeader('Content-Type', 'application/json');
  err={
    success:"false",
    message:"Login Not Successful!! Username or password is not correct"
  }
  res.json({err:err});
})

//This is called when there is Error while Registration Process

router.get('/registration_error',(req,res)=>{
  res.statusCode=500
  res.setHeader('Content-Type','application/json');
  err={
    success:"false",
    message:"Registration Not Successful!! Please Try Again With different Username or Mobile Number"
  }
  res.json({err:err});
})

module.exports = router;
