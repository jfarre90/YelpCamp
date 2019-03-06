var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

//root route
router.get("/", function(req, res){
    res.render("landing");
});

// show register form
router.get("/register", function(req, res){
   res.render("register", {page: "register"}); 
});

//handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            req.flash("error", err.message);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/campgrounds"); 
        });
    });
});

//show login form
router.get("/login", function(req, res){
   res.render("login", {page: "login"}); 
});

//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "LOGGED YOU OUT!");
   res.redirect("/campgrounds");
});

// forgot password route
router.get("/forgotPassword", function(req,res){
    res.render("forgotPassword")
})

router.post("/forgotPassword", function(req,res, next){
    async.waterfall([
        function(done){
            crypto.randomBytes(20, function(err, buff) {
                var token = buff.toString("hex");
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({email: req.body.email}, function(err, user) {
                if (err) console.log(err);
                if (!user) {
                    req.flash("error", "That email does not match any account.");
                    return res.redirect("/forgotPassword");
                }
                
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now()+3600000; //1 hour before the password expires

                user.save(function(err) {
                    done(err,token,user);
                });
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "farpracontact@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: "javier-donotreply@yelpcamp.com",
                subject:"Yelpcamp password reset",
                text: "you are receiving this because you (or someone else) have requested the reset of their password \n\n"+
                "Please click on the following link, or paste this into your browser to complete the process: \n"+
                "http://" + req.headers.host + "/reset/" + token + "\n\n" +
                "If you didn't request a password change, please ignore this email and your password will remain unchanged."
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                if (err) console.log(err);
                console.log("mail sent");
                req.flash("success", "An e-mail has been sent to " + user.email + " with further instructions to reset the password.");
                done(err, "done");
            });
        }
    ], function (err) {
        if (err) console.log(err);
        if (err) return next(err);
        res.redirect("/forgotPassword");
    });
});

router.get("/reset/:token", function (req, res) {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt:Date.now() }}, function(err, user) {
        if(err){
            console.log(err);
        } else if(!user) {
            req.flash("error", "Your password reset link is invalid or has expired.");
            return res.redirect("/forgotPassword");
        }
        res.render("resetPassword", {token: req.params.token});
    });
});

router.post("/reset/:token", function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now()} }, function(err, user) {
        if (err) console.log(err);
        if (!user) {
          req.flash("error", "Password reset token is invalid or has expired.");
          return res.redirect("back");
        }
        if(req.body.password.new === req.body.password.confirm) {
            //passport local mongoose method
            user.setPassword(req.body.password.new, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect("back");
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: "Gmail", 
        auth: {
          user: "farpracontact@gmail.com",
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: "do-not-reply@yelpcamp.com",
        subject: "Your password has been changed",
        text: "Hello,\n\n" +
          "This is a confirmation that the password for your account " + user.email + " has just been changed.\n"
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash("success", "Success! Your password has been changed.");
        done(err);
      });
    }
  ], function(err) {
    res.redirect("/campgrounds");
  });
});



module.exports = router;