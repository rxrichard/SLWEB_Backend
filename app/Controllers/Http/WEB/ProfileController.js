"use strict";

const { seeToken } = require("../../../POG/jwt");
const Database = use("Database");

class ProfileController {
  /** @param {object} ctx
   * @param {import('@adonisjs/framework/src/Request')} ctx.request
   */
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      const res = await Database.raw(
        "select * from dbo.FilialEntidadeGrVenda as F left join dbo.SIGAMAT as S on F.M0_CODFIL = S.M0_CODFIL inner join dbo.Parametros as P on P.GrpVen = F.A1_GRPVEN where P.GrpVen = ?",
        [verified.grpven]
      );

      response.status(200).send(res[0]);
    } catch (err) {
      response.status(400).send();
    }
  }

  async ChangePassword({ request, response }) {
    const token = request.header("authorization");
    const { password } = request.only(["password"]);

    if (password.nova !== password.confirmacao) {
      //Caso a senha nova não bater com a confirmação
      response.status(409).send();
    } else if (password.nova.length > 6) {
      //Caso a senha nova exceder os 6 digitos
      response.status(406).send();
    } else {
      try {
        const verified = seeToken(token);

        //busca senha antiga
        const oldPassword = await Database.select("Senha")
          .from("dbo.FilialAcesso")
          .where({
            GrpVen: verified.grpven,
          });

        //Caso a senha atual não ter sido corretamente digitada
        if (oldPassword[0].Senha.trim() !== password.atual) {
          response.status(405).send();
        } else if (oldPassword[0].Senha.trim() === password.nova) {
          //Caso da antiga senha ser igual à nova
          response.status(304).send();
        } else {
          //atualiza senha no BD
          await Database.table("dbo.FilialAcesso")
            .where({
              GrpVen: verified.grpven,
            })
            .update({ Senha: password.nova });

          response.status(200).send();
        }
      } catch (err) {
        response.status(400).send();
      }
    }
  }

  async ChangeEmail({ request, response }) {
    const token = request.header("authorization");
    const { email } = request.only(["email"]);

    if (email === "" || email === null || typeof email == "undefined") {
      throw Error;
    }

    try {
      const verified = seeToken(token);

      //atualiza email no BD
      await Database.table("dbo.FilialEntidadeGrVenda")
        .where({
          A1_GRPVEN: verified.grpven,
        })
        .update({ Email: email });

      response.status(200).send();
    } catch (err) {
      response.status(400).send();
    }
  }

  async ChangeTax({ request, response }) {
    const token = request.header("authorization");
    const { newTax } = request.only(["newTax"]);

    try {
      const verified = seeToken(token);

      if (newTax.tipo === "PERCENTUAL" && parseFloat(newTax.valor) >= 100)
        response.status(412);

      await Database.table("dbo.Parametros")
        .where({
          GrpVen: verified.grpven,
        })
        .update({
          ParamTxt: newTax.tipo,
          ParamVlr:
            newTax.tipo === "PERCENTUAL"
              ? parseFloat(newTax.valor) / 100
              : parseFloat(newTax.valor),
        });

      response.status(200).send();
    } catch (err) {
      response.status(400).send();
    }
  }
}

module.exports = ProfileController;
