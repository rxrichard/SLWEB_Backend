"use strict";
const Database = use("Database");
const Env = use("Env");
const Helpers = use("Helpers");
const { GenTokenTMT, ListClients } = require("../../../POG/TMTConn");
const GerarExcel = require("../../../POG/excelExportService");

class Sl2TelController {
  async Update({ response, params }) {
    let EquiCod = params.equicod;
    let filial = params.filial;

    // busco os dados da posse da máquina que acabaram de ser gravados no SLAplic
    const PDV = await Database.raw(
      "select * from dbo.PontoVenda as P inner join dbo.Cliente as C on P.CNPJ = C.CNPJ  where P.EquiCod = ? and P.PdvStatus = ?",
      [EquiCod, "A"]
    );

    // faço o login e recebo um token
    const tokenTMT = await GenTokenTMT(filial);

    // requisito todos os clientes da filial
    const lista = await ListClients(tokenTMT.data.access_token);

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
    response.status(200).send(PDV);
    // response.status(200).send({ PontoDeVenda: PDV[0], EquiCod})
  }

  async Teste({ response }) {
    const Consultor = "CRISTIANE";
    const workSheetName = [];
    const filePath = Helpers.publicPath(`/Endereços Outros.xlsx`);
    const workSheetColumnNames = [
      "Filial",
      "Franqueado(a)",
      "Ativo",
      "Cliente",
      "Logradouro",
      "Número",
      "Complemento",
      "Bairro",
      "Cidade",
      "UF",
      "CEP",
      "Data de Ativação(SLAPlic)",
    ];
    const data = [];

    const Ativos = await Database.raw(
      "select F.M0_CODFIL as Filial, F.GrupoVenda as Franqueado, P.EquiCod as Ativo, P.AnxDesc as Cliente,P.PdvLogradouroPV as Logradouro, P.PdvNumeroPV as Número, P.PdvComplementoPV as Complemento, P.PdvBairroPV as Bairro, P.PdvCidadePV as Cidade, P.PdvUfPV as UF, P.PdvCEP as CEP, P.PdvDataAtivacao as 'DtAlteração' from dbo.PontoVenda as P inner join dbo.FilialEntidadeGrVenda as F on F.A1_GRPVEN = P.GrpVen where P.PdvStatus = 'A' and F.Consultor <> 'ALESSANDRO' and F.Consultor <> 'CRISTIANE' order by M0_CODFIL",
      []
    );

    Ativos.map((ativo) => {
      if (workSheetName.indexOf(ativo.Filial) < 0) {
        workSheetName.push(ativo.Filial);
        data.push([
          [
            ativo.Filial,
            ativo.Franqueado,
            ativo.Ativo,
            ativo.Cliente,
            ativo.Logradouro,
            ativo.Número,
            ativo.Complemento,
            ativo.Bairro,
            ativo.Cidade,
            ativo.UF,
            ativo.CEP,
            ativo.DtAlteração,
          ],
        ]);
      } else {
        data[workSheetName.indexOf(ativo.Filial)].push([
          ativo.Filial,
          ativo.Franqueado,
          ativo.Ativo,
          ativo.Cliente,
          ativo.Logradouro,
          ativo.Número,
          ativo.Complemento,
          ativo.Bairro,
          ativo.Cidade,
          ativo.UF,
          ativo.CEP,
          ativo.DtAlteração,
        ]);
      }
    });

    await GerarExcel(data, workSheetColumnNames, workSheetName, filePath);
    // data, workSheetColumnNames, workSheetName, filePath

    response.status(200).send("Ok");
  }
}

module.exports = Sl2TelController;
