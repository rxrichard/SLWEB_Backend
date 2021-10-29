'use strict'

const Drive = use("Drive");

class SLaplicIntController {
    async AttSLAPLIC({ response }) {
        try {
          // PUXO O FORMULÁRIO DA REDE
          const formulario = await Drive.get(
            `\\\\192.168.1.250\\dados\\Franqueado\\SLAPLIC\\SL_APLIC.accdb`
          );
          
          response.status(200).send(formulario);
        } catch (err) {
          response.status(400).send(err);
        }
      }
}

module.exports = SLaplicIntController
