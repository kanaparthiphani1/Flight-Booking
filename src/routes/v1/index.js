const express = require("express");

const { InfoController } = require("../../controllers");
const BookingRouter = require("./booking-router");

const router = express.Router();

router.get("/info", InfoController.info);
router.use("/bookings", BookingRouter);

module.exports = router;
