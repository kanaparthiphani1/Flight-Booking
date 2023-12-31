const axios = require("axios");
const { StatusCodes } = require("http-status-codes");

const { BookingRepo } = require("../repositories");
const { ServerConfig, Queue } = require("../config");
const { Enums } = require("../utils/common");
const { CANCELLED, BOOKED, INITIATED, PENDING } = Enums;
const db = require("../models");
const AppError = require("../utils/errors/app-error");

const bookingRepository = new BookingRepo();

async function createBooking(data) {
  const transaction = await db.sequelize.transaction();
  try {
    console.log(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flight-trip/${data.flightTripId}`
    );
    const flightTrip = await axios.get(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flight-trip/${data.flightTripId}`
    );
    const flightTripData = flightTrip.data.data;
    if (data.noofSeats > flightTripData.totalSeats) {
      throw new AppError("Not enough seats available", StatusCodes.BAD_REQUEST);
    }
    const totalBillingAmount = data.noofSeats * flightTripData.price;
    const bookingPayload = { ...data, totalCost: totalBillingAmount };
    const booking = await bookingRepository.create(bookingPayload, transaction);

    console.log("Seats : ", data.noofSeats);
    console.log(
      "Req : ",
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flight-trip/${data.flightTripId}/seats`
    );
    await axios.patch(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flight-trip/${data.flightTripId}/seats`,
      {
        seats: data.noofSeats,
      }
    );

    await transaction.commit();
    return booking;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function makePayment(data) {
  console.log("CAME HERE");
  const transaction = await db.sequelize.transaction();
  try {
    const bookingDetails = await bookingRepository.get(
      data.bookingId,
      transaction
    );
    console.log("CAME HERE 2");

    if (bookingDetails.status == CANCELLED) {
      throw new AppError("The booking has expired", StatusCodes.BAD_REQUEST);
    }
    // console.log(bookingDetails);
    const bookingTime = new Date(bookingDetails.createdAt);
    const currentTime = new Date();
    if (currentTime - bookingTime > 300000) {
      await cancelBooking(data.bookingId);
      throw new AppError("The booking has expired", StatusCodes.BAD_REQUEST);
    }
    if (bookingDetails.totalCost != data.totalCost) {
      throw new AppError(
        "The amount of the payment doesnt match",
        StatusCodes.BAD_REQUEST
      );
    }
    if (bookingDetails.userId != data.userId) {
      throw new AppError(
        "The user corresponding to the booking doesnt match",
        StatusCodes.BAD_REQUEST
      );
    }
    // we assume here that payment is successful
    await bookingRepository.update(
      data.bookingId,
      { status: BOOKED },
      transaction
    );
    Queue.sendData({
      recepientEmail: "kanaparthiphani0@gmail.com",
      subject: "Flight booked",
      text: `Booking successfully done for the booking ${data.bookingId}`,
    });
    await transaction.commit();
  } catch (error) {
    console.log("CAME HERE3", error);

    await transaction.rollback();
    throw error;
  }
}

async function cancelBooking(bookingId) {
  const transaction = await db.sequelize.transaction();
  try {
    const bookingDetails = await bookingRepository.get(bookingId, transaction);
    console.log(bookingDetails);
    if (bookingDetails.status == CANCELLED) {
      await transaction.commit();
      return true;
    }
    console.log(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flight-trip/${bookingDetails.flightTripId}/seats`
    );
    console.log("Noof seats : ", bookingDetails.noofSeats);
    await axios.patch(
      `${ServerConfig.FLIGHT_SERVICE}/api/v1/flight-trip/${bookingDetails.flightTripId}/seats`,
      {
        seats: bookingDetails.noofSeats,
        dec: 0,
      }
    );
    console.log("CAME here yooo");
    await bookingRepository.update(
      bookingId,
      { status: CANCELLED },
      transaction
    );
    console.log("CAME here yooo  2");

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function cancelOldBookings() {
  try {
    const time = new Date(Date.now() - 1000 * 300);
    const response = await bookingRepository.cancelOldBookings(time);

    return response;
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  createBooking,
  makePayment,
  cancelOldBookings,
};
