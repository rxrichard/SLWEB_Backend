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
    const token = request.header("authorization");
    const CNPJ = params.CNPJ

    try {
      const verified = seeToken(token);

      axios
      .get(`https://receitaws.com.br/v1/cnpj/${CNPJ}`)
      .then(response => {
        console.log(response.data)
      })
      .catch(err => {
        console.log(err)
      })

      response.status(200).send();
    } catch (err) {
      response.status(400).send(err);
    }
  }

  async Store({ request, response }) {
    try {
      const token = request.header("authorization");
      const { cliente } = request.only(["cliente"]);

      const verified = seeToken(token);

      cliente.GrpVen = verified.grpven;

      if (cliente.TPessoa === "F") {
        const CNPJ_cru = cliente.CNPJn.replace(/([-,./])/g, "");
        const CNPJ_SEM_ZEROS_A_ESQUERDA = `000${CNPJ_cru}`;
        const CNPJ_COMPLETO = CNPJ_SEM_ZEROS_A_ESQUERDA.slice(-11);

        var CPF = [];

        CPF[0] = CNPJ_COMPLETO.substring(0, 3);
        CPF[1] = CNPJ_COMPLETO.substring(3, 6);
        CPF[2] = CNPJ_COMPLETO.substring(6, 9);
        CPF[3] = CNPJ_COMPLETO.substring(9, 11);

        cliente.CNPJss = `${CPF[0]}.${CPF[1]}.${CPF[2]}-${CPF[3]}`;

        cliente.CNPJn = parseInt(CNPJ_cru);
        cliente.CNPJ = CNPJ_COMPLETO;
      } else {
        const CNPJ_cru = cliente.CNPJn.replace(/([-,./])/g, "");
        const CNPJ_SEM_ZEROS_A_ESQUERDA = `000${CNPJ_cru}`;
        const CNPJ_COMPLETO = CNPJ_SEM_ZEROS_A_ESQUERDA.slice(-14);

        var CNPJss = [];

        CNPJss[0] = CNPJ_COMPLETO.substring(0, 2);
        CNPJss[1] = CNPJ_COMPLETO.substring(2, 5);
        CNPJss[2] = CNPJ_COMPLETO.substring(5, 8);
        CNPJss[3] = CNPJ_COMPLETO.substring(8, 12);
        CNPJss[4] = CNPJ_COMPLETO.substring(12, 14);

        cliente.CNPJss = `${CNPJss[0]}.${CNPJss[1]}.${CNPJss[2]}/${CNPJss[3]}-${CNPJss[4]}`;

        cliente.CNPJn = parseInt(CNPJ_cru);
        cliente.CNPJ = CNPJ_COMPLETO;
      }

      await Database.insert({
        GrpVen: cliente.GrpVen,
        CNPJn: cliente.CNPJn,
        A1_COD: "",
        A1_LOJA: "",
        CNPJ: cliente.CNPJ,
        CNPJss: cliente.CNPJss,
        Nome_Fantasia: cliente.Nome_Fantasia.toUpperCase(),
        Razão_Social: cliente.Razão_Social.toUpperCase(),
        IE: cliente.IE,
        Logradouro: cliente.Logradouro.toUpperCase(),
        Número: cliente.Número,
        Complemento: cliente.Complemento.toUpperCase(),
        Bairro: cliente.Bairro.toUpperCase(),
        CEP: cliente.CEP.replace(/\.|\-/g, ""),
        Município: cliente.Município.toUpperCase(),
        UF: cliente.UF.toUpperCase(),
        Contato_Empresa: cliente.Contato_Empresa.toUpperCase(),
        Email: cliente.Email,
        DDD: `0${cliente.DDD}`,
        Fone: cliente.Fone,
        A1_SATIV1: "",
        NIRE: null,
        FPAS: null,
        NIREDt: null,
        DtSolicita: new Date().toISOString(),
        DtCadastro: null,
        TPessoa: cliente.TPessoa,
      }).into("dbo.Cliente");

      response.status(201).send();
    } catch (err) {
      response.status(400).send();
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
