var express = require('express');
var router = express.Router();
var passport = require('passport');
const bodyParser = require('body-parser');
var User = require('../models/user');
var authenticate = require('../authenticate');
router.use(bodyParser.json());

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
  User.register(new User({username: req.body.username}), 
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
      passport.authenticate('local',{failureRedirect: '/users/error'})(req, res, () => {
        var token = authenticate.getToken({_id: req.user._id});
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true,token:token,status: 'Registration Successful!'});
      });
    }
  });
});
/* This is for logging */
router.post('/login',passport.authenticate('local',{failureRedirect: '/users/error'}), (req, res) => {
  var token = authenticate.getToken({_id: req.user._id});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({success: true,token:token,status: 'You are successfully logged in!'});
});

/*If user logout then session will be destroyed*/

router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

// This is called when user is not authenticated
router.get('/error',(req,res) =>{
  res.statusCode = 401;
  res.setHeader('Content-Type', 'application/json');
  res.json({err:'You are not Authenticated'});
})

module.exports = router;
