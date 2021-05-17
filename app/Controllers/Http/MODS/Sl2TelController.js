"use strict";
const Database = use("Database");
const Env = use("Env");
const { GenTokenTMT, ListClients } = require('../../../POG/TMTConn')

class Sl2TelController {
  async Update({ response, params }) {
    let EquiCod = params.equicod
    let filial = params.filial


    // busco os dados da posse da máquina que acabaram de ser gravados no SLAplic
    const PDV = await Database.raw('select * from dbo.PontoVenda as P inner join dbo.Cliente as C on P.CNPJ = C.CNPJ  where P.EquiCod = ? and P.PdvStatus = ?', [EquiCod, 'A'])

    // faço o login e recebo um token
    const tokenTMT = await GenTokenTMT(filial)

    // requisito todos os clientes da filial
    const lista = await ListClients(tokenTMT.data.access_token)
    
    // testo o cnpj pra ver se o cliente já existe na tmt
    // let existeCliente = null
    // lista.list.map(cliente => {
    //     if(cliente.Cnpj === PDV.CNPJ){
    //         existeCliente = cliente.Id
    //     }
    // })



    /* 


        se não existir eu crio com os dados do slaplic
        se já existir eu atualizo com os que eu já tem no slaplic

        
        */
    response.status(200).send(PDV)
    // response.status(200).send({ PontoDeVenda: PDV[0], EquiCod})
  }
}

module.exports = Sl2TelController;
