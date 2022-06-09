'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Rastros {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
  async handle({ request, response }, next, properties) {
    console.log(request.protocol())
    console.log(request.method())
    console.log(request.url())
    console.log(request.originalUrl())
    console.log(request.headers().origin)
    console.log(request.ip())
    console.log(request.headers().host)
    console.log(request.headers()['user-agent'])
    console.log(properties[0])
    console.log(request.headers().authorization)

    await next()
  }
}

module.exports = Rastros
