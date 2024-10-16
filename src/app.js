import express from "express";
import { configDotenv } from "dotenv";
import passport from "passport";
import googleAuth from "./auth/googleAuth.js";
import expressSession from "express-session";
import configurePassport from "./middlewares/passportConfig.js";
import { isAuthenticated } from "./middlewares/authenticate.js";
import cors from 'cors';
import { authRouter } from "./routes/auth.Route.js";
import { productRouter } from "./routes/product.Route.js";
import fileUpload from 'express-fileupload'
import { getMyAds, getNotification } from "./middlewares/product.middleware.js";
import { Product } from "./schema/product.Schema.js";
configDotenv();

const app = express();

configurePassport();

app.use(express.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
}));

app.use(cors({

  origin: [process.env.CLIENT_HOST, 'https://rental-sigma.vercel.app/', "http://localhost:3000"],
  credentials: true,
}));


app.use(
  expressSession({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,

      maxAge: 86400
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Google Auth route
app.use("/", googleAuth);

// Auth routes
app.use("/api/v1/auth", authRouter)

// Product Routes
app.use("/api/v1/product", productRouter);


// Default Testing Endpoint
app.get("/api/v1/", (req, res) => {

  console.log("user", req.user);
  return res.status(200).json("API Version 1.0");
});

// Ads Routes
app.get("/api/v1/myads", isAuthenticated, getMyAds);

// Logout Endpoint
app.get('/api/v1/logout', isAuthenticated, (req, res) => {
  req.logout();
  res.redirect('/api/v1');
})

app.get("/api/v1/notification", isAuthenticated, getNotification);

export default app;


