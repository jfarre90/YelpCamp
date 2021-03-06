var express = require("express");
var router  = express.Router();
var User = require("../models/user");
var Campground = require("../models/campground");
var middleware = require("../middleware");




router.get("/:id", function(req,res){
    User.findById(req.params.id, function(err, foundUser){
        if(err) {
            req.flash("error","Something went wrong.");
            console.log(err);
            return res.redirect("/");
        }
        Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds) {
            if(err) {
                req.flash("error","Something went wrong.");
                console.log(err);
                return res.redirect("/");
            }   
            res.render("users/show", {user: foundUser, campgrounds: campgrounds});
        });
    });
    
});

router.get ("/:id/adminRequest", middleware.isLoggedIn, function(req, res) {
    User.findById(req.params.id, function (err, user){
        if (err){
            console.log(err);
            req.flash("error", "something went wrong");
        } 
        res.render("users/adminRequest", {user: user});   
    })
    
});

router.post ("/:id", function (req,res){
    if(req.body.adminCode ==="secret"){
        User.findByIdAndUpdate(req.params.id, {isAdmin: true} , function(err, user){
            if(err){
                req.flash("error", "you don't exist in the database");
                return res.redirect("back");
            } 
            req.flash("success", "You are now an admin "+ user.username);
            res.redirect("/campgrounds");
        
        });
        
    }  else {
        console.log("code incorrect");
    } 
});


module.exports = router;
