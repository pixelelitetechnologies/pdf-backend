/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-useless-escape */
// import { existsSync, mkdirSync, renameSync } from "fs";
import jwt from "jsonwebtoken";
import validator from "email-validator";
import User from "../../db/models/user";
import activityLog from "../../services/activityLog";
import { ACTIVITY_LOG_TYPES } from "../../../constant";
import sendEmail from "../../services/sendEmail";

const register = async (req, res) => {
  try {
    const registerData = req.body;

    if (!registerData.email) {
      throw new Error("Please enter a your email");
    } else {
      if (!validator.validate(registerData.email)) {
        throw new Error("Please enter a valid email");
      } else {
        const user_count = await User.find({ email: registerData.email });
        if (user_count.length != 0) {
          throw new Error("User already exist");
        } else {
          if (user_count.length != 0) {
            throw new Error("This Email is already assiociate with us");
          }
        }
      }
    }

    const isNonWhiteSpace = /^\S*$/;
    if (!isNonWhiteSpace.test(registerData.password)) {
      throw new Error("Password must not contain Whitespaces.");
    }

    const isContainsUppercase = /^(?=.*[A-Z]).*$/;
    if (!isContainsUppercase.test(registerData.password)) {
      throw new Error("Password must have at least one Uppercase Character.");
    }

    const isContainsLowercase = /^(?=.*[a-z]).*$/;
    if (!isContainsLowercase.test(registerData.password)) {
      throw new Error("Password must have at least one Lowercase Character.");
    }

    const isContainsNumber = /^(?=.*[0-9]).*$/;
    if (!isContainsNumber.test(registerData.password)) {
      throw new Error("Password must contain at least one Digit.");
    }

    const isContainsSymbol =
      /^(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_₹]).*$/;
    if (!isContainsSymbol.test(registerData.password)) {
      throw new Error("Password must contain at least one Special Symbol.");
    }

    const isValidLength = /^.{6,16}$/;
    if (!isValidLength.test(registerData.password)) {
      throw new Error("Password must be 6-16 Characters Long.");
    }

    if (registerData.password != registerData.confirmPassword) {
      throw new Error("Confirm Password dosen't match");
    }
    if (!registerData.phone) {
      throw new Error("Please enter a Phone Number");
    }
    // if (!registerData.fax) {
    //     throw new Error("Please enter a Fax");
    // }
    const user = new User({ ...req.body });
    let data = await user.save();
    // const tempArray = {};
    // tempArray["oldData"] = null;
    // tempArray["newData"] = data;

    // const activityData = await activityLog.create(
    //   data._id,
    //   data.role_id,
    //   ACTIVITY_LOG_TYPES.CREATED,
    //   req,
    //   tempArray
    // );

    data = JSON.parse(JSON.stringify(data));

    await sendEmail(
      data.email,
      "Congratulations Account Created Successfully",
      "Congratulations your account is created. Please add your professional info and wait for the admin approval."
    );

    // Image Upload code start

    // const upload_data = {
    //     db_response: data,
    //     file: req.files[0],
    // };
    // const image_uri = await S3.uploadFile(upload_data);

    const response = await User.findByIdAndUpdate(
      data._id,
      // { $set: { profile_photo: image_uri.Location } },
      { new: true }
    );

    const token = jwt.sign({ _id: data._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).json({
      status: true,
      type: "success",
      message: "User Registration Successfully",
      data: {
        ...response.toObject(),
        token: token,
      },
    });
  } catch (error) {
    // deleteFileByPath(req.file?.path);
    if (error.code == 11000) {
      res.status(400).json({
        status: false,
        type: "error",
        message: "Email Already exist",
      });
    } else {
      res.status(400).json({
        status: false,
        type: "error",
        message: error.message,
      });
    }
  }
};

export default register;