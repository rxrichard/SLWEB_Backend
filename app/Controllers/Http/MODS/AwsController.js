"use strict";
const Database = use("Database");
const Drive = use("Drive");
const { seeToken } = require('../../../Services/jwtServices')

const logger = require("../../../../dump/index")

class AwsController {
  //atualizar posse da máquina no totvs
  async Show({ request, response, params }) {
    const token = request.header("authorization");
    const filetype = params.type
    let file = null

    try {
      const verified = seeToken(token);

      if (filetype === 'ovpn') {
        const nomeOVPN = `Pilao_${verified.user_code}_Pilao.ovpn`

        file = await Drive.get(`\\\\192.168.1.250\\dados\\SLTEC\\NUVEM\\VPN\\${nomeOVPN}`)
      } else if (filetype === 'pritunl') {
        file = await Drive.get(`\\\\192.168.1.250\\dados\\SLTEC\\NUVEM\\Pritunl.exe`)
      }

      response.status(200).send(file);
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: params,
        payload: request.body,
        err: err,
        handler: 'AwsController.Show',
      })
    }
  }

  async See({ request, response }) {
    const token = request.header("authorization");
    const verified = seeToken(token);

    try {
      const awsData = await Database
        .select('VPN_pin')
        .from('dbo.AcessosAWS')
        .where({
          Filial: verified.user_code
        })

      response.status(200).send({
        vpn_pin: awsData[0]? awsData[0].VPN_pin : null
      })
    } catch (err) {
      response.status(400).send()
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'AwsController.See',
      })
    }
  }
}

module.exports = AwsController;
