"use strict";

const Database = use("Database");
const { seeToken } = require("../../../POG/jwt");
const axios = require("axios").default;

class ClientController {
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      const clientes = await Database.select("*")
        .from("dbo.Cliente")
        .where({ GrpVen: verified.grpven })
        .orderBy("Nome_Fantasia", "ASC");

      response.status(200).send(clientes);
    } catch (err) {
      response.status(400).send();
    }
  }

  async See({ request, response, params }) {
    const CNPJ = params.CNPJ
    const Tipo = params.Tipo
    let ClienteValido = true

    try {
      let receitawsData = null

      //verificar se já está cadastrado com alguem
      const ClienteJaExiste = await Database
        .select('*')
        .from('dbo.Cliente')
        .where({
          CNPJ: CNPJ,
          ClienteStatus: 'A'
        })

      //verificar se é um franqueado Pilão
      const ClienteEFranqueado = await Database
        .select('*')
        .from('dbo.FilialEntidadeGrVenda')
        .where({
          M0_CGC: CNPJ
        })

      if (ClienteJaExiste.length > 0 || ClienteEFranqueado.length > 0) {
        ClienteValido = false
      }

      if (Tipo === "J" && ClienteValido) {
        const response = await axios.get(`https://receitaws.com.br/v1/cnpj/${CNPJ}`)
        receitawsData = response.data
      }

      response.status(200).send({
        ClienteValido,
        wsInfo: receitawsData
      });
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async Store({ request, response }) {
    const token = request.header("authorization");
    const { cliente } = request.only(["cliente"]);

    try {
      const verified = seeToken(token);
      let CNPJss = null
      let CNPJ_AUX = null
      
      if (cliente.TPessoa === "F") {
        CNPJ_AUX = String(cliente.CNPJ).slice(-11);
        
        CNPJss = `${String(CNPJ_AUX).substring(0, 3)}.${String(CNPJ_AUX).substring(3, 6)}.${String(CNPJ_AUX).substring(6, 9)}-${String(CNPJ_AUX).substring(9, 11)}`
      } else {
        CNPJ_AUX = String(cliente.CNPJ).slice(-14);
        
        CNPJss = `${String(CNPJ_AUX).substring(0, 2)}.${String(CNPJ_AUX).substring(2, 5)}.${String(CNPJ_AUX).substring(5, 8)}/${String(CNPJ_AUX).substring(8, 12)}-${String(CNPJ_AUX).substring(12, 14)}`
      }

      const ultimoCliCod = await Database.raw("select MAX(A1_COD) as LastCliCod from dbo.Cliente where A1_COD like 'N%'")
      const ultimoCliCodNum = Number(String(ultimoCliCod[0].LastCliCod).split("N")[1]) + 1
      const proximoCliCod = `N${`00000${ultimoCliCodNum}`.slice(-5)}`

      const novoCliente = {
        GrpVen: verified.grpven,
        CNPJn: Number(cliente.CNPJ),
        A1_COD: proximoCliCod,
        A1_LOJA: '01',
        CNPJ: cliente.CNPJ,
        CNPJss: CNPJss,
        Nome_Fantasia: String(cliente.Nome_Fantasia).trim(),
        Razão_Social: String(cliente.Razão_Social).trim(),
        IE: String(cliente.IE).trim(),
        Logradouro: String(cliente.Logradouro).trim(),
        Número: String(cliente.Número).trim(),
        Complemento: String(cliente.Complemento).trim(),
        Bairro: String(cliente.Bairro).trim(),
        CEP: String(cliente.CEP).trim(),
        Município: String(cliente.Município).trim(),
        UF: String(cliente.UF).trim(),
        Contato_Empresa: String(cliente.Contato_Empresa).trim(),
        Email: String(cliente.Email).trim(),
        DDD: String(cliente.DDD).trim(),
        Fone: String(cliente.Fone).trim(),
        A1_SATIV1: '000114',
        NIRE: null,
        FPAS: null,
        NIREDt: null,
        DtSolicita: new Date(),
        DtCadastro: new Date(),
        TPessoa: cliente.TPessoa,
        A1Tipo: 'F',
        TipoLogradouro: null,
        Ibge: null,
        ClienteStatus: 'A'
      }

      await Database.insert(novoCliente).into("dbo.Cliente");

      response.status(201).send({ ClienteCadastrado: novoCliente });
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async Update({ request, response }) {
    const token = request.header("authorization");
    const { cliente } = request.only(["cliente"]);

    try {
      const verified = seeToken(token);

      await Database.table("dbo.Cliente")
        .where({
          GrpVen: verified.grpven,
          A1_COD: cliente.A1_COD,
          A1_LOJA: cliente.A1_LOJA,
          CNPJn: cliente.CNPJ,
        })
        .update({
          Nome_Fantasia: String(cliente.Nome_Fantasia).trim(),
          IE: String(cliente.IE).trim(),
          Logradouro: String(cliente.Logradouro).trim(),
          Número: String(cliente.Número).trim(),
          Complemento: String(cliente.Complemento).trim(),
          Bairro: String(cliente.Bairro).trim(),
          CEP: String(cliente.CEP).trim(),
          Município: String(cliente.Município).trim(),
          UF: String(cliente.UF).trim(),
          Contato_Empresa: String(cliente.Contato_Empresa).trim(),
          Email: String(cliente.Email).trim(),
          DDD: String(cliente.DDD).trim(),
          Fone: String(cliente.Fone).trim(),
          TPessoa: String(cliente.TPessoa).trim(),
        });

      response.status(201).send();
    } catch (err) {
      response.status(400).send();
    }
  }

  async Destroy({ request, response }) {
    const token = request.header("authorization");
    const { CNPJ } = request.only(["CNPJ"]);

    try {
      const verified = seeToken(token);

      const hasTransaction = await Database.select("*")
        .from("dbo.SDBase")
        .where({
          GRPVEN: verified.grpven,
          A1_CGC: CNPJ,
        });

      if (hasTransaction.length > 0) {
        return 409;
      }

      const hasAnnex = await Database.select("*").from("dbo.Anexos").where({
        GrpVen: verified.grpven,
        CNPJ: CNPJ,
      });

      if (hasAnnex.length > 0) {
        return 409;
      }

      const hasPDV = await Database.select("*").from("dbo.PontoVenda").where({
        GrpVen: verified.grpven,
        CNPJ: CNPJ,
      });

      if (hasPDV.length > 0) {
        return 409;
      }

      await Database.table("dbo.Cliente")
        .where({
          GrpVen: verified.grpven,
          CNPJ: CNPJ,
        })
        .delete();

      response.status(200).send();
    } catch (err) {
      response.status(400).send();
    }
  }
}

module.exports = ClientController;
