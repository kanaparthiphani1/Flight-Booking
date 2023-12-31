const { StatusCodes } = require("http-status-codes");
const { BookingService } = require("../services");
const { SuccessResponse, ErrorResponse } = require("../utils/common");

async function createBooking(req, res) {
  try {
    console.log("Req : ", req.body);
    const response = await BookingService.createBooking({
      flightTripId: req.body.flightTripId,
      userId: req.body.userId,
      noofSeats: req.body.noofSeats,
    });
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    ErrorResponse.error = error;
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
  }
}

async function makePayment(req, res) {
  try {
    const response = await BookingService.makePayment({
      totalCost: req.body.totalCost,
      userId: req.body.userId,
      bookingId: req.body.bookingId,
    });
    SuccessResponse.data = response;
    return res.status(StatusCodes.OK).json(SuccessResponse);
  } catch (error) {
    console.log("CAME 4");
    ErrorResponse.error = error;
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse);
  }
}

module.exports = {
  createBooking,
  makePayment,
};