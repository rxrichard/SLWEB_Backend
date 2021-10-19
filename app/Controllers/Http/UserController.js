"use strict";

const Database = use("Database");
const Mail = use("Mail");
const Env = use("Env");
const { genToken, genTokenADM, genTokenExternal } = require("../../POG/index");

class UserController {
  async Login({ request, response }) {
    const { user_code, password } = request.only(["user_code", "password"]);

    try {
      //testa usuario + senha informados
      const token = await genToken(user_code, password);

      response.status(202).send(token); //Retorno do token
    } catch (err) {
      response.status(401).send();
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
        response.status(204).send();
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
          "emails.forgot",
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
    }
  }

  async AdmAtempt({ request, response }) {
    const { admin_code, admin_password } = request.only([
      "admin_code",
      "admin_password",
    ]);

    try {
      const isAdm = await Database.raw(
        "select O.M0_CODFIL, F.Senha, T.TopeDes from dbo.Operador as O inner join dbo.FilialAcesso as F on O.M0_CODFIL = F.M0_CODFIL inner join dbo.TipoOper as T on O.TopeCod = T.TopeCod where O.TopeCod <> 3 and O.M0_CODFIL = ? and F.Senha = ?",
        [admin_code, admin_password]
      );

      if (isAdm.length > 0) {
        const franqueados = await Database.select("M0_CODFIL", "GrupoVenda")
          .from("dbo.FilialEntidadeGrVenda")
          .orderBy("M0_CODFIL", "ASC");

        response.status(200).send(franqueados);
      } else {
        response.status(401).send();
      }
    } catch (err) {
      response.status(400).send();
    }
  }

  async AdmLogin({ request, response }) {
    const { admin_code, user_code, admin_password } = request.only([
      "admin_code",
      "user_code",
      "admin_password",
    ]);
    try {
      //verifico se existe esse administrador
      const isAdm = await Database.raw(
        "select O.M0_CODFIL, F.Senha, T.TopeDes from dbo.Operador as O inner join dbo.FilialAcesso as F on O.M0_CODFIL = F.M0_CODFIL inner join dbo.TipoOper as T on O.TopeCod = T.TopeCod where O.TopeCod <> 3 and O.M0_CODFIL = ? and F.Senha = ?",
        [admin_code, admin_password]
      );
      if (isAdm.length < 1) return isAdm;

      //crio token com codido do adm, codigo do cliente, senha e nivel do adm
      const admToken = await genTokenADM(user_code, admin_password, admin_code);

      response.status(200).send(admToken);
    } catch (err) {
      response.status(400).send();
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
        const updatedRows = await Database.table("dbo.CrossLogin")
          .where({
            M0_CODFIL: code,
            Logou: false,
          })
          .update({
            Logou: true,
          });

        if (updatedRows.length < 1) {
          throw new Error('Tentativa de login não registrada corretamente');
        }

        const token = await genTokenExternal(code);
        response.status(201).send(token);
      }else{
        throw new Error('Mais de 1 minuto de redirecionamento');
      }
    } catch (err) {
      response.status(401).send(err);
    }
  }
}

module.exports = UserController;
