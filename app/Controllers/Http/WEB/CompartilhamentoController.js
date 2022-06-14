"use strict";

const Database = use("Database");
const { seeToken } = require("../../../Services/jwtServices");
const logger = require("../../../../dump/index")
const fs = require('fs');
const path = require('path');

class CompartilhamentoController {
  async Show({ request, response, params }) {
    const token = request.header("authorization");
    let folder = params.folder

    try {
      const verified = seeToken(token);

      let targetFolder = null

      //pego a raiz dos arquivos
      const sub = await Database
        .select('*')
        .from('dbo.SLWEB_Compartilhamento_Index')
        .where({
          depth: 1
        })

      // verificar se houve solicitação de uma pasta em especifico
      if (folder === 'all') {
        targetFolder = sub[0].path
        folder = sub[0].path_alias
      } else {
        //substituo _ por \ que havia sido invertido na URI
        let fixedFolder = path.join(...String(folder).split('_'))

        //substituo o apelido da raiz pela propria raiz
        targetFolder = String(fixedFolder).replace(sub[0].path_alias, sub[0].path)
      }

      let folderPath = decodeURI(path.join(targetFolder))
      let folderAlias = decodeURI(path.join(...String(folder).split('_')))

      let res = fs.readdirSync(folderPath).map(fileName => {
        return fileName;
      })

      response.status(200).send({
        arquivos: res.filter(arq => arq.includes('.')).map(filename => { return ({ filename: filename, path: path.join(folderAlias, filename) }) }),
        pastas: res.filter(arq => !arq.includes('.')).map(folder => { return ({ folder: folder, path: path.join(folderAlias, folder) }) }),
        pathSegments: folderAlias.split('\\').filter(p => p !== '')
      });
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: params,
        payload: request.body,
        err: err,
        handler: 'CompartilhamentoController.Show',
      })
    }
  }

  async Download({ request, response, params }) {
    const token = request.header("authorization");
    const filePath = params.filepath

    try {
      const verified = seeToken(token);

      console.log(filePath)

      //verificar se o cara pode baixar o negocio
      //baixar o negocio


    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: params,
        payload: request.body,
        err: err,
        handler: 'CompartilhamentoController.Download',
      })
    }
  }
}

module.exports = CompartilhamentoController;
