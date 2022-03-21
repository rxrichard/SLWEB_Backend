"use strict";

const Database = use("Database");
const Mail = use("Mail");
const Env = use("Env");
const { genToken, genTokenAdm, genTokenAdmWithFilial, genTokenExternal, seeToken } = require("../../Services/jwtServices");
const logger = require("../../../dump/index")

class UserController {
  /** @param {object} ctx
   * @param {import('@adonisjs/framework/src/Request')} ctx.request
   */
  async Login({ request, response }) {
    const { user_code, password } = request.only(["user_code", "password"]);

    try {
      //testa usuario + senha informados
      const token = await genToken(user_code, password);
      
      response.status(202).send(token); //Retorno do token
    } catch (err) {
      response.status(401).send();
      logger.error({
        token: null,
        params: null,
        payload: request.body,
        err: err,
        handler: 'UserController.Login',
      })
    }
  }

  async Forgot({ request, response }) {
    const { user_code } = request.only(["user_code"]);

    try {
      const checkUser = await Database.select("*")
        .from("dbo.FilialEntidadeGrVenda")
        .where({
          M0_CODFIL: user_code,
        });

      if (checkUser.length < 1) {
        //se não encontrar o codigo do franqueado
        response.status(400).send();
      } else {
        //se encontrar o codigo do franqueado

        //busca a senha do franqueado
        const senha = await Database.select("Senha")
          .from("dbo.FilialAcesso")
          .where({
            M0_CODFIL: user_code,
          });

        //envia a senha do franqueado por email
        await Mail.send(
          "emails.forgotPassword",
          { checkUser, password: senha[0].Senha },
          (message) => {
            message
              .to(checkUser[0].Email)
              .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
              .subject("Recuperação de senha");
          }
        );

        response.status(200).send();
      }
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: null,
        params: null,
        payload: request.body,
        err: err,
        handler: 'UserController.Forgot',
      })
    }
  }

  async AdmPartialLogin({ request, response }) {
    const { admin_code, admin_password } = request.only([
      "admin_code",
      "admin_password",
    ]);

    try {
      const token = await genTokenAdm(admin_code, admin_password)

      response.status(202).send(token);
    } catch (err) {
      response.status(401).send();
      logger.error({
        token: null,
        params: null,
        payload: request.body,
        err: err,
        handler: 'UserController.AdmPartialLogin',
      })
    }
  }

  async AdmFullLogin({ request, response }) {
    const token = request.header("authorization");
    const { user_code } = request.only(["user_code"]);

    try {
      const verified = seeToken(token);

      if (verified.role === 'Franquia') {
        throw new Error('Acesso negado')
      }

      //crio token com codido do adm, codigo do cliente, senha e nivel do adm
      const admTokenWithFilial = await genTokenAdmWithFilial(user_code, verified);

      response.status(200).send(admTokenWithFilial);
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'UserController.AdmFullLogin',
      })
    }
  }

  async ExternalAuth({ request, response }) {
    const { code } = request.only(["code"]);

    try {
      const tentativa = await Database.select("*")
        .from("dbo.CrossLogin")
        .where({
          M0_CODFIL: code,
          Logou: false,
        })
        .orderBy("DtSolicita", "Desc");

      if (tentativa.length < 1) throw new Error('Cross login não registrado pelo SLAplic');

      const HorarioMaximo = new Date(
        new Date(tentativa[0].DtSolicita).getFullYear(),
        new Date(tentativa[0].DtSolicita).getMonth(),
        new Date(tentativa[0].DtSolicita).getDate(),
        new Date(tentativa[0].DtSolicita).getHours(),
        new Date(tentativa[0].DtSolicita).getMinutes() + 1,
        new Date(tentativa[0].DtSolicita).getSeconds()
      );

      const HorarioAtual = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
        new Date().getHours() - 3,
        new Date().getMinutes(),
        new Date().getSeconds()
      );

      //data criação <= data de criação + 1min
      if (HorarioAtual < HorarioMaximo) {
        await Database.table("dbo.CrossLogin")
          .where({
            M0_CODFIL: code,
            Logou: false,
          })
          .update({
            Logou: true,
          });

        const token = await genTokenExternal(code);

        response.status(201).send(token);
      } else {
        throw new Error('Mais de 1 minuto de redirecionamento');
      }

    } catch (err) {
      response.status(401).send();
      logger.error({
        token: null,
        params: null,
        payload: request.body,
        err: err,
        handler: 'UserController.ExternalAuth',
      })
    }
  }
}

module.exports = UserController;
