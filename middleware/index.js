var Comment = require("../models/comment");
var Campground = require("../models/campground");

module.exports = {
    isLoggedIn: function(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        req.flash("error", "You must be signed in to do that!");
        res.redirect("/login");
    },
    checkUserCampground: function(req, res, next){
        if(req.isAuthenticated()){
            Campground.findById(req.params.id, function(err, campground){
                if (err || !campground){
                    req.flash("error","Campground not found");
                    res.redirect("back");
                }else if(campground.author.id.equals(req.user._id) || req.user.isAdmin){
                   next();
               } else {
                   req.flash("error", "You don't have permission to do that!");
                   console.log("naughty man!");
                   res.redirect("/campgrounds/" + req.params.id);
               }
            });
        } else {
            req.flash("error", "You need to be signed in to do that!");
            res.redirect("/login");
        }
    },
    checkUserComment: function(req, res, next){
        console.log("YOU MADE IT!");
        if(req.isAuthenticated()){
            Comment.findById(req.params.commentId, function(err, comment){
                if(err) {
                    req.flash("error", "Comment not found");
                    res.redirect("back");
                } else if(comment.author.id.equals(req.user._id) || req.user.isAdmin){
                   next();
               } else {
                   req.flash("error", "You don't have permission to do that!");
                   res.redirect("/campgrounds/" + req.params.id);
               }
            });
        } else {
            req.flash("error", "You need to be signed in to do that!");
            res.redirect("login");
        }
    }
}