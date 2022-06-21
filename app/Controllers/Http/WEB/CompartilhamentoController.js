"use strict";

const Database = use("Database");
const { seeToken } = require("../../../Services/jwtServices");
const logger = require("../../../../dump/index")
const moment = require('moment')
const fs = require('fs');
const path = require('path');
moment.locale("pt-br");

class CompartilhamentoController {

  async Show({ request, response, params }) {
    const token = request.header("authorization");
    let folder = params.folder
    let folderPath = null
    let folderAlias = null

    try {
      const verified = seeToken(token);

      //pego a raiz dos arquivos
      const root = await Database
        .select('*')
        .from('dbo.SLWEB_Compartilhamento_Index')
        .where({
          type: 'root'
        })

      //verificar permissão do usuário
      if (await somehowVerifyIfUserShouldHaveAccessToFileOrDirectory(folder, verified)) {
        throw new Error('Acesso bloqueado')
      }

      // verificar se houve solicitação de uma pasta em especifico
      if (folder === 'root') {
        folderPath = root[0].path
        folderAlias = root[0].path_alias
      } else {
        //substituo o apelido da raiz pela propria raiz
        folderPath = decodeURI(folder).replace(root[0].path_alias, root[0].path)

        folderAlias = decodeURI(folder)
      }

      let dirMap = fs.readdirSync(folderPath).map(fileName => {
        return fileName;
      })

      let files = dirMap.filter(arq =>
        arq.includes('.') && (
          !arq.includes('.lnk') &&
          !arq.includes('.db') &&
          !arq.includes('.log') &&
          !arq.includes('.DS_Store') &&
          arq.charAt(0) !== '.'
        )
      ).map(filename => { return ({ filename: filename, path: path.join(folderAlias, filename) }) })

      let folders = dirMap.filter(arq =>
        !arq.includes('.')
      ).map(folder => { return ({ folder: folder, path: path.join(folderAlias, folder) }) })


      folders = await somehowRemoveFilesOrDirectoriesUnauthorizedToTheUser(folders, verified)
      files = await somehowRemoveFilesOrDirectoriesUnauthorizedToTheUser(files, verified)

      response.status(200).send({
        arquivos: files,
        pastas: folders,
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

      //verificar permissão do usuário
      if (await somehowVerifyIfUserShouldHaveAccessToFileOrDirectory(filePath, verified)) {
        throw new Error('Acesso bloqueado')
      }

      //pego a raiz dos arquivos
      const root = await Database
        .select('*')
        .from('dbo.SLWEB_Compartilhamento_Index')
        .where({
          type: 'root'
        })

      const fullFilePath = decodeURI(filePath).replace(root[0].path_alias, root[0].path)

      response.attachment(fullFilePath)
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

  async Upload({ request, response }) {
    const token = request.header("authorization");
    const multiples = request.input('multiple')
    const formData = request.file("formData", {
      types: ["image", "pdf"],
    });

    try {
      const verified = seeToken(token);

      const uploadPath = await Database
        .select('*')
        .from('dbo.SLWEB_Compartilhamento_Index')
        .where({
          type: 'UPLOAD_DUMP'
        })


      //verificar se o cara pode fazer upload
      if (await somehowVerifyIfUserShouldHaveAccessToFileOrDirectory(uploadPath[0].path, verified)) {
        throw new Error('Acesso bloqueado')
      }

      const fullPathToFiles = `${uploadPath[0].path}\\${verified.role}\\${moment().format('LL')}`

      //verificar se é um ou muitos arquivos
      if (multiples === 'N') {
        await formData.move(fullPathToFiles, {
          overwrite: true
        });
      } else {
        await formData.moveAll(fullPathToFiles, (file) => {
          return {
            overwrite: true,
          };
        })
      }

      response.status(200).send();
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'CompartilhamentoController.Upload',
      })
    }
  }

  async ShowIndexedFolders({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      //verificar se o cara é usuário sistema
      if (!verified.role === "Sistema") {
        throw new Errow('Usuário não permitido')
      }

      //retornar a lista das tela indexadas e o TipoOper
      const dir = await Database
        .select('*')
        .from('dbo.SLWEB_Compartilhamento_Index')

      const TipoOperadores = await Database
        .select('*')
        .from('dbo.TipoOper')
        .orderBy('AccessLevel', 'ASC')


      response.status(200).send({
        indexedFolders: dir,
        tipoOperadores: TipoOperadores
      });
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'CompartilhamentoController.ShowIndexedFolders',
      })
    }
  }
}

module.exports = CompartilhamentoController;

//verificar se o usuário tem direito a pasta/arquivos
const somehowVerifyIfUserShouldHaveAccessToFileOrDirectory = async (filepath, decriptedToken) => {
  let isBlockedFolder = false

  const compartilhamentoIndex = await Database
    .select('*')
    .from('dbo.SLWEB_Compartilhamento_Index')


  const OperAccessLevel = await Database
    .select('AccessLevel')
    .from('dbo.TipoOper')
    .where({
      TopeDes: decriptedToken.role
    })

  //verificar se esta tentando acessar a raiz dos arquivos
  if (filepath === 'root') {
    // verificar se a raiz dos arquivos pode ser acessada por ele
    if (compartilhamentoIndex.filter(folder => folder.type === 'root')[0].AccessLevel <= OperAccessLevel[0].AccessLevel) {
      isBlockedFolder = false
    } else {
      isBlockedFolder = true
    }
  } else {
    //verificar se a o caminho que está tentando acessar está disponivel
    const blockedFolders = compartilhamentoIndex.map(indexedFolder => indexedFolder.AccessLevel > OperAccessLevel[0].AccessLevel ? indexedFolder.path : null)

    blockedFolders.forEach(BF => {
      if (String(
        decodeURI(filepath).replace(compartilhamentoIndex[0].path_alias, compartilhamentoIndex[0].path)
      ).includes(BF)) {

        isBlockedFolder = true
      }
    })
  }

  return isBlockedFolder
}

//remove pastas/arquivos que o usuário não tem direito do resultado da varredura do DIR
const somehowRemoveFilesOrDirectoriesUnauthorizedToTheUser = async (dir, decriptedToken) => {
  let clearDir = []

  const compartilhamentoIndex = await Database
    .select('*')
    .from('dbo.SLWEB_Compartilhamento_Index')


  const OperAccessLevel = await Database
    .select('AccessLevel')
    .from('dbo.TipoOper')
    .where({
      TopeDes: decriptedToken.role
    })

  //verificar se a o caminho que está tentando acessar está disponivel
  const blockedFolders = compartilhamentoIndex.map(indexedFolder => indexedFolder.AccessLevel > OperAccessLevel[0].AccessLevel ? indexedFolder.path : null)

  dir.forEach(item => {
    let isBlockedItem = false
    let formatedItemName = String(item.path).replace(compartilhamentoIndex[0].path_alias, compartilhamentoIndex[0].path)

    blockedFolders.forEach(blockedFolder => {
      if (formatedItemName.includes(blockedFolder)) {
        isBlockedItem = true
      }
    })

    if (!isBlockedItem) {
      clearDir.push(item)
    }
  })

  return clearDir
}