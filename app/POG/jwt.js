const Database = use("Database");
const jwt = require("jsonwebtoken");
const Env = use("Env");

exports.seeToken = (token) => {
  try {
    const verified = jwt.verify(token, Env.get("APP_KEY"));

    return verified;
  } catch (err) {
    return err;
  }
};

exports.genToken = async (user_code, password) => {
  try {
      //login franqueado
      const user = await Database.select("*")
        .from("dbo.FilialAcesso")
        .where({ M0_CODFIL: String(user_code), Senha: String(password) });

      if (user.length > 0) {
        const name = await Database.select("*")
          .from("dbo.FilialEntidadeGrVenda")
          .where({ M0_CODFIL: user[0].M0_CODFIL });
        const token = jwt.sign(
          {
            user_code: user[0].M0_CODFIL,
            grpven: user[0].GrpVen,
            role: "Franquia",
            user_name: name[0].GrupoVenda,
            timestamp: new Date().toISOString(),
          },
          Env.get("APP_KEY"),
          { expiresIn: "2h" }
        );
        return { nome: name[0].GrupoVenda, token, role: "Franquia" };
      } else {
        throw new Error('credenciais inválidas');
    }
  } catch (err) {
    return err.message;
  }
};

exports.genTokenADM = async (user_code, admin_password, admin_code) => {
  try {
    const isAdm = await Database.raw(
      "select O.M0_CODFIL, O.OperNome, F.Senha, T.TopeDes from dbo.Operador as O inner join dbo.FilialAcesso as F on O.M0_CODFIL = F.M0_CODFIL inner join dbo.TipoOper as T on O.TopeCod = T.TopeCod where O.TopeCod <> 3 and O.M0_CODFIL = ? and F.Senha = ?",
      [admin_code, admin_password]
    );
    if (isAdm.length < 1) return 401;

    const User = await Database.select("M0_CODFIL", "GrupoVenda", "A1_GRPVEN")
      .from("dbo.FilialEntidadeGrVenda")
      .where({
        M0_CODFIL: user_code,
      });
    if (User.length < 1) return 404;

    const token = jwt.sign(
      {
        user_code,
        grpven: User[0].A1_GRPVEN,
        role: isAdm[0].TopeDes,
        timestamp: new Date().toLocaleString(),
        user_name: User[0].GrupoVenda,
        admin_code,
      },
      Env.get("APP_KEY"),
      {
        expiresIn: "2h",
      }
    );

    return { nome: User[0].GrupoVenda, token, role: isAdm[0].TopeDes };
  } catch (err) {
    return "Falha ao gerar token";
  }
};

exports.genTokenExternal = async (code) => {
  try {

    const dados = await Database.select("*")
          .from("dbo.FilialEntidadeGrVenda")
          .where({ M0_CODFIL: code })

    const token = jwt.sign(
      {
        user_code: dados[0].M0_CODFIL,
        grpven: dados[0].A1_GRPVEN,
        role: "Franquia",
        user_name: dados[0].GrupoVenda,
        timestamp: new Date().toISOString(),
      },
      Env.get("APP_KEY"),
      { expiresIn: "2h" }
    );

    return { nome: dados[0].GrupoVenda, token, role: "Franquia" }
  } catch (err) {
    return null;
  }
};

exports.dateCheck = () => {
  const data = new Date();
  data.setHours(data.getHours() - 3);

  return data.toISOString();
};
