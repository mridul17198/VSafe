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
    },
    emergencyContact1:{
        type:String,
        default:"",
        unique:true
    },
    emergencyContact2:{
        type:String,
        default:"",
        unique:true
    },
    emergencyContact3:{
        type:String,
        default:"",
        unique:true
    }
});
User.plugin(passportLocalMongoose);

module.exports=mongoose.model('User',User);