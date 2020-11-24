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
      next(err);
    }
    else{
      res.send(user);
    }
  })
});

/*This is for Registration*/

router.post('/signup', (req, res, next) => {
  User.register(new User({username: req.body.username,phonenumber:req.body.phonenumber,emergencyContact1:req.body.emergencyContact1,emergencyContact2:req.body.emergencyContact2,emergencyContact3:req.body.emergencyContact3}), 
    req.body.password, (err, user) => {
    if(err) {      
    passport.authenticate('local',{failureRedirect: '/users/registration_error'})(req, res, () => {
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
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true,token:token,status: 'You are successfully logged in!'});
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

router.post('/optVerify',authenticate.verifyUser,(req,res)=>{
  client
       .verify
       .services(process.env.SERVICE_ID || config.serviceID)
       .verificationChecks
       .create({
         to:`+91${req.user.phonenumber}`,
         code:req.body.code
       })
       .then((data)=>{
        if(data.valid)
        {
          req.user.verify=true;
          req.user.save().then(()=>{
          res.statusCode=200;
          res.setHeader('Content-Type','application/json');
          res.json({success: true,data:data,status: 'Code successfully Verified!'})
          },(err)=>{
            res.statusCode=500
            res.setHeader('Content-Type','application/json');
            res.json(({err:err}))
          })
          .catch((err)=>{
            res.statusCode=500
            res.setHeader('Content-Type','application/json');
            res.json(({err:err}))
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
