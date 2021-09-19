"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseDataSource = void 0;
const mongodb_1 = require("mongodb");
const apollo_datasource_1 = require("apollo-datasource");
class ResponseDataSource extends apollo_datasource_1.DataSource {
    constructor(responses) {
        super();
        this.responses = responses;
    }
    async createResponse(response) {
        const createdAt = new Date().toISOString();
        const result = await this.responses.insertOne({ response, createdAt });
        return result.insertedId.toString();
    }
    getResponseById(id) {
        return this.responses.findOne({
            _id: new mongodb_1.ObjectId(id),
        }, { projection: { _id: 0, response: 1, createdAt: 1 } });
    }
    getAllResponses() {
        return this.responses
            .find({}, { projection: { _id: 0, response: 1, createdAt: 1 } })
            .limit(100)
            .toArray();
    }
}
exports.ResponseDataSource = ResponseDataSource;
