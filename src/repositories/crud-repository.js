const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");

class CRUDRepo {
  constructor(model) {
    this.model = model;
  }

  //getbyId
  async getById(data) {
    const res = await this.model.findByPk(data);
    if (!res) {
      throw new AppError(
        "not Able to find the resource ",
        StatusCodes.NOT_FOUND
      );
    }
    return res;
  }

  //getAll
  async getAll() {
    return await this.model.findAll();
  }
  //create
  async create(data) {
    return await this.model.create(data);
  }

  //deletebyid
  async destroy(id) {
    const res = await this.model.destroy({
      where: {
        id,
      },
    });

    if (!res) {
      throw new AppError(
        "Not able to fund the resource",
        StatusCodes.NOT_FOUND
      );
    }

    return res;
  }
}

module.exports = CRUDRepo;
