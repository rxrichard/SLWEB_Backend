'use strict'
const { seeToken } = require("../POG/jwt");

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class TokenValidate {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request, response }, next) {
    try {
      const token = request.header('Authorization')

      if (!token) {
        throw new Error('token não fornecido')
      }

      const verified = seeToken(token)

      if(!verified.grpven){
        throw new Error('token inválido')
      }

      await next()
    } catch (err) {
      response.status(498).send({ message: 'sessão inválida' })
    }
  }
}

module.exports = TokenValidate
