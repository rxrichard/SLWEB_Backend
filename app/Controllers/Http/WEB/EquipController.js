"use strict";

const Database = use("Database");
const { seeToken } = require("../../../POG/jwt");

class EquipController {
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      const ativos = await Database.raw(ShowAllAtivosFilial, [verified.grpven, verified.grpven]);

      const clientes = await Database.select('A1_COD', 'A1_LOJA', 'CNPJ', 'CNPJss', 'Nome_Fantasia').from('dbo.Cliente').where({
        GrpVen: verified.grpven
      }).orderBy('Nome_Fantasia', 'ASC')

      response.status(200).send({ Ativos: ativos, Clientes: clientes });
    } catch (err) {
      response.status(400).send(err)
    }
  }

  async See({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      const reports = await Database
        .select('EquiCod', 'EqKODesc', 'EqKoTipo', 'EqKoDtAbertura', 'EquiDesc', 'EqKoDtFechamento')
        .from('dbo.EquipamentoKO')
        .where({
          GrpVen: verified.grpven
        }).orderBy('EqKoDtAbertura', 'DESC');

      response.status(200).send({ Reports: reports });
    } catch (err) {
      response.status(400).send(err)
    }
  }

  async StoreReport({ request, response }) {
    const token = request.header("authorization");
    const { Report } = request.only(['Report']);

    try {
      const verified = seeToken(token);

      await Database.insert({
        GrpVen: verified.grpven,
        EquiCod: Report.ativo,
        EqKODesc: Report.obs,
        EqKoTipo: Report.ocorrencia,
        EqKoDtAbertura: Report.createdAt,
        EquiDesc: Report.modelo,
        EqKoDtFechamento: null,
      }).into("dbo.EquipamentoKO");

      response.status(200).send({ message: 'ok' });
    } catch (err) {
      response.status(400).send(err)
    }
  }

  async DeleteReport({ request, response }) {
    const token = request.header("authorization");
    const { Report } = request.only(['Report']);

    try {
      const verified = seeToken(token);

      await Database.table("dbo.EquipamentoKO")
        .where({
          GrpVen: verified.grpven,
          EquiCod: Report.EquiCod,
          EqKoDtAbertura: Report.EqKoDtAbertura,
        })
        .update({
          EqKoDtFechamento: new Date(),
        });

      response.status(200).send({ message: 'ok' });
    } catch (err) {
      response.status(400).send(err)
    }
  }

  // async Update({ request }) {
  //   const { token, cliente, maquina } = request.only([
  //     "token",
  //     "cliente",
  //     "maquina",
  //   ]);

  //   try {
  //     const verified = seeToken(token);

  //     const contractExists = await Database.select("*")
  //       .from("dbo.Contrato")
  //       .where({ CNPJ: cliente.CNPJ, GrpVen: verified.grpven });

  //     if (contractExists.length === 0) {
  //       //verifica se existe contrato para cliente, se não, cria

  //       await Database.table("dbo.Contrato").insert({
  //         GrpVen: cliente.GrpVen,
  //         CNPJ: cliente.CNPJ,
  //         ConId: 1,
  //         cnpjn: cliente.CNPJn,
  //         Dt_Inicio: new Date().toISOString(),
  //         Dt_Fim: null,
  //         ConMesBase: null,
  //         Nome_Fantasia: cliente.Nome_Fantasia,
  //         Contato_Empresa: cliente.Contato_Empresa,
  //         Email: null,
  //         Contato_Empresa_2: null,
  //         Email_2: null,
  //         Fone_2: null,
  //         Contato2: null,
  //         Obs_Específica_Cliente:
  //           "Contrato criado automaticamente pela tela Equipamentos web",
  //         CLIENTE: null,
  //         CNPJss: cliente.CNPJss,
  //       });
  //     }

  //     const anexoExists = await Database.select("*")
  //       .from("dbo.Anexos")
  //       .where({ CNPJ: cliente.CNPJ, GrpVen: verified.grpven });

  //     if (anexoExists.length === 0) {
  //       //verifica se existe anexo para cliente, se não, cria

  //       const proxAnxId = await Database.select("*")
  //         .from("dbo.Anexos")
  //         .where({ GrpVen: verified.grpven });

  //       await Database.table("dbo.Anexos").insert({
  //         GrpVen: cliente.GrpVen,
  //         CNPJ: cliente.CNPJ,
  //         CNPJss: cliente.CNPJss,
  //         ConId: 1,
  //         AnxId: proxAnxId[proxAnxId.length - 1].AnxId + 1,
  //         AnxDesc: cliente.Nome_Fantasia,
  //         CalcFatId: 255,
  //         TseId: null,
  //         TfaId: null,
  //         AnxDiaFecha: 30,
  //         AnxProRata: "N",
  //         AnxCPAG: 0,
  //         AnxFatMinimo: "N",
  //         AnxCalcMinPor: "A",
  //         AnxTipMin: "R",
  //         AnxMinMoeda: "S",
  //         AnxConsDose: null,
  //         AnxConsDose2: null,
  //         AnxConsDose3: null,
  //         AnxConsValor: null,
  //         AnxConsValor2: null,
  //         AnxConsValor3: null,
  //         ProdId: null,
  //         AnxVlrUnitMin: null,
  //         AnxVlrUnitMin2: null,
  //         AnxVlrUnitMin3: null,
  //         AnxStatus: null,
  //         AnxDataInclusao: null,
  //         AnxDataEncerramento: null,
  //         AnxMotivoEncerramento: null,
  //         AnxObs: "Anexo criado automaticamente pela tela Equipamentos web",
  //         GfaId: null,
  //         GsaId: null,
  //         AnxCodAnterior: null,
  //         AnxMsgNF: null,
  //         AnxDataUltFat: null,
  //         AnxDtEmisUFat: null,
  //         AnxDetalheNotaAluguel: null,
  //         ClienteId: null,
  //         CondPagId: null,
  //         AnxVencimentoDia: null,
  //         ProdIdEMin: null,
  //       });
  //     }

  //     const AnxId = await Database.select("AnxId")
  //       .from("dbo.Anexos")
  //       .where({ GrpVen: verified.grpven, CNPJ: cliente.CNPJ });

  //     //verifica se a máquina já está em algum pdv
  //     const pdvExists = await Database.select("*")
  //       .from("dbo.PontoVenda")
  //       .where({ EquiCod: maquina.EquiCod[0] });

  //     //procura pelo numero de Ponto de vendas que o cliente ja tem
  //     const proxPdvId = await Database.select("PdvId")
  //       .from("dbo.PontoVenda")
  //       .where({ AnxId: AnxId[0].AnxId, CNPJ: cliente.CNPJ });

  //     //verifica se a maquina já não está cadastrada com outra pessoa, se não cria ponto de venda
  //     if (pdvExists.length === 0) {
  //       await Database.table("dbo.PontoVenda").insert({
  //         GrpVen: verified.grpven,
  //         AnxId: AnxId[0].AnxId,
  //         PdvId:
  //           proxPdvId.length === 0
  //             ? 1
  //             : proxPdvId[proxPdvId.length - 1].PdvId + 1, //se for o primeiro ponto de vendas, define como 1,
  //         CNPJ: cliente.CNPJ,
  //         ConId: 1,
  //         EquiCod: maquina.EquiCod[0],
  //         IMEI: maquina.IMEI[0],
  //         PdvDepartamento: null,
  //         PdvStatus: maquina.EquiStatus,
  //         PdvLogradouroPV: cliente.Logradouro.trim(),
  //         PdvNumeroPV: cliente.Número,
  //         PdvComplementoPV: cliente.Complemento,
  //         PdvBairroPV: cliente.Bairro,
  //         PdvCidadePV: cliente.Município.trim(),
  //         PdvUfPV: cliente.UF,
  //         PdvCEP: cliente.CEP,
  //         DepId: 1,
  //         CfgId: 1,
  //         PdvConsMin: null,
  //         PdvConsValor: null,
  //         PdvConsDose: null,
  //         PdvDataSolicitacao: null,
  //         PdvDataInclusao: null,
  //         PdvDataAtivacao: new Date().toISOString(),
  //         PdvDataAlteracao: null,
  //         PdvDtSolicEncerra: null,
  //         PdvDataEncerramento: null,
  //         PdvDtEmisUFat: null,
  //         PdvDataUltFat: null,
  //         PdvMotivoEncerramento: null,
  //         PdvObs: "Ponto de vendas criado pela tela Equipamentos web",
  //         GfaId: null,
  //         GsaId: null,
  //         PdvEmiteFicha: null,
  //         PdvAluguelVlr: null,
  //         pdvCodAnt: null,
  //         PdvGeraUltFat: null,
  //         PdvVlrAcessorios: null,
  //         PdvFoiTroca: null,
  //         PdvIniciaAutoCobraMin: null,
  //         PdvDtIniciaAutoCobraMin: null,
  //         CcuID: null,
  //         PdvTabelaPrecoSnacks: null,
  //         PdvSeq: null,
  //         PdvSomaCompartilhado: null,
  //         TAS_Id: null,
  //         TFC_ID: null,
  //         FlgAlt: null,
  //         POS: null,
  //         TprId: null,
  //         EquiMatr: parseFloat(maquina.EquiCod[0]),
  //         EQUIPMOD_Desc: maquina.EquiDesc,
  //         AnxDesc: cliente.Nome_Fantasia.trim(),
  //       });

  //       return 200;
  //     } else {
  //       //verifica se estamos tentando trocar o cliente por ele mesmo
  //       const isTheSame = await Database.select("*")
  //         .from("dbo.PontoVenda")
  //         .where({ CNPJ: cliente.CNPJ, EquiCod: maquina.EquiCod[0] });
  //       if (isTheSame.length > 0) return 406;

  //       //atualiza a maquina que já está com alguem, pelo novo cliente

  //       const affectedRows = await Database.table("dbo.PontoVenda")
  //         .where({
  //           EquiCod: maquina.EquiCod[0],
  //         })
  //         .update({
  //           AnxId: AnxId[0].AnxId,
  //           PdvId:
  //             proxPdvId.length === 0
  //               ? 1
  //               : proxPdvId[proxPdvId.length - 1].PdvId + 1, //se for o primeiro ponto de vendas, define como 1
  //           CNPJ: cliente.CNPJ,
  //           PdvLogradouroPV: cliente.Logradouro.trim(),
  //           PdvNumeroPV: cliente.Número,
  //           PdvComplementoPV: cliente.Complemento,
  //           PdvBairroPV: cliente.Bairro,
  //           PdvCidadePV: cliente.Município.trim(),
  //           PdvUfPV: cliente.UF,
  //           PdvCEP: cliente.CEP,
  //           PdvDataAlteracao: new Date().toISOString(),
  //           PdvObs: "Ponto de venda alterado pela tela Equipamentos web",
  //           AnxDesc: cliente.Nome_Fantasia.trim(),
  //         });

  //       if (affectedRows === 0) throw err;

  //       return 200;
  //     }
  //   } catch (err) {
  //     return 400;
  //   }
  // }
}

module.exports = EquipController;

const ShowAllAtivosFilial = "select E.*, P.Nome_Fantasia, P.CNPJss, P.AnxId, P.PdvId, P.CNPJn from dbo.Equipamento as E left join (SELECT dbo.PontoVenda.EquiCod, dbo.Cliente.Nome_Fantasia, dbo.Cliente.CNPJss, dbo.PontoVenda.AnxId, dbo.PontoVenda.PdvId, dbo.Cliente.CNPJn FROM ( ( dbo.Cliente INNER JOIN dbo.Contrato ON (dbo.Cliente.CNPJ = dbo.Contrato.CNPJ) AND (dbo.Cliente.GrpVen = dbo.Contrato.GrpVen) ) INNER JOIN dbo.Anexos ON (dbo.Contrato.CNPJ = dbo.Anexos.CNPJ) AND (dbo.Contrato.ConId = dbo.Anexos.ConId) AND (dbo.Contrato.GrpVen = dbo.Anexos.GrpVen) ) INNER JOIN dbo.PontoVenda ON (dbo.Anexos.AnxId = dbo.PontoVenda.AnxId) AND ( dbo.Anexos.GrpVen = dbo.PontoVenda.GrpVen ) WHERE ( ((dbo.Cliente.GrpVen) = ?) AND ((dbo.PontoVenda.PdvStatus) = 'A') )) as P on E.EquiCod = P.EquiCod where E.GrpVen = ?"