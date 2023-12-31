const cron = require("node-cron");

const { BookingService } = require("../../services");

function scheduleCrons() {
  //running every 30 min
  cron.schedule("*/30 * * * *", async () => {
    await BookingService.cancelOldBookings();
  });
}

module.exports = scheduleCrons;
