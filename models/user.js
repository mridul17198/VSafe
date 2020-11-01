var mongoose=require('mongoose');
const passport = require('passport');
var Schema=mongoose.Schema;

// This helps to create a user model with password in hash form
var passportLocalMongoose=require('passport-local-mongoose');

var User= new Schema({
    phonenumber:{
        type:String,
        default:"",
        unique:true
    },
    verify:{
        type:Boolean,
        default:false
    }
});
User.plugin(passportLocalMongoose);

module.exports=mongoose.model('User',User);