'use strict'

const pacote = require('../../package.json')
const Database = use("Database");
const logger = require("../../dump/index")
const moment = require("moment");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Rastros {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request, response, params }, next, properties) {
    const token = request.header("authorization") ? request.header("authorization") : ''

    try {
      await Database.insert({
        timestamp: moment().subtract(3, 'hours').toDate(),
        protocol: request.protocol(),
        method: request.method(),
        url: request.url(),
        full_url: request.originalUrl(),
        consumer: request.headers().origin,
        IP: request.ip(),
        host: request.headers().host,
        agent: request.headers()['user-agent'],
        token: token,
        app_version: pacote.version,
        environment: process.env.NODE_ENV
      }).into('dbo.RastrosWEB')

    } catch (err) {
      logger.error({
        token: token,
        params: params,
        payload: request.body,
        err: err,
        handler: 'Rastros.handle',
      })
    }

    await next()
  }
}

module.exports = Rastros
