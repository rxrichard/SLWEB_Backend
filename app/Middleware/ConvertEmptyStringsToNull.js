'use strict'

<<<<<<< HEAD
=======
//Desativei isso porque tava me complicando com o controller de Compras
>>>>>>> 06e7de08b7eef7a0e6446204afd76773aa430790
class ConvertEmptyStringsToNull {
  async handle ({ request }, next) {
    if (Object.keys(request.body).length) {
      request.body = Object.assign(
        ...Object.keys(request.body).map(key => ({
          [key]: request.body[key] !== '' ? request.body[key] : null
        }))
      )
    }

    await next()
  }
}

module.exports = ConvertEmptyStringsToNull
