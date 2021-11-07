"use strict";

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use("Route");

//TESTE
Route.get("/", function () {
  return { message: "API Funcionando!" };
});

//Integração com API TOTVS
Route.get("/tel/update/:filial/:equicod", "MODS/Sl2TelController.Update");
Route.get("/mifix/consulta/ativo/:ativo", "MODS/Sl2TelController.Show");

//Disparar Emails
Route.get("/emails/history", "ADMIN/MailerController.Show");
Route.get("/emails/recipients/:model", "ADMIN/MailerController.See");

//Sessão
Route.post("/auth", "UserController.Login");
Route.post("/forgot", "UserController.Forgot");
Route.post("/admAuth", "UserController.AdmLogin");
Route.get("/admAuth", "UserController.AdmAtempt");
Route.post("/checkAuth", "UserController.ExternalAuth");

//Usuário
Route.get("/profile", "WEB/ProfileController.Show");
Route.put("/profile/password", "WEB/ProfileController.ChangePassword");
Route.put("/profile/email", "WEB/ProfileController.ChangeEmail");
Route.put("profile/tax", "WEB/ProfileController.ChangeTax");

//Leads
Route.get("/leads", "WEB/LeadController.Show");
Route.get("/leads/:lead", "WEB/LeadController.See");
Route.put("/leads", "WEB/LeadController.Update");
Route.post("/leads", "WEB/LeadController.Store");

//Clientes
Route.post("/client/details", "WEB/ClientController.See"); //mostra contagem de dados
Route.get("/client", "WEB/ClientController.Show"); //retorna clientes
Route.post("/client/new", "WEB/ClientController.Store"); //adicionar cliente
Route.put("/client/update", "WEB/ClientController.Update"); //atualiza cliente
Route.delete("/client/delete", "WEB/ClientController.Destroy"); //apagar cliente?

//Compras
Route.get("/compras/produtos", "WEB/CompraController.Produtos"); //retorna lista de produtos compraveis
Route.get("/compras/contas", "WEB/CompraController.Contas"); //retorna lista de produtos compraveis
Route.get("/compras/pedidos", "WEB/CompraController.Pedidos"); //retorna pedidos atendidos e abertos do cliente
Route.get("/compras/pedidos/detalhes/:ID/:STATUS", "WEB/CompraController.PedidoDet"); //retorna detalhes do pedido
Route.delete("/compras/pedidos/cancelar/:ID", "WEB/CompraController.Cancelar"); //retorna detalhes do pedido
Route.get("/compras/retrivepdf/:ID", "WEB/CompraController.RetrivePDF"); //retorna o pdf do pedido
Route.post("/compras/comprar", "WEB/CompraController.Comprar"); //retorna detalhes do pedido

//Vendas
Route.get("/vendas/produtos", "WEB/VendaController.Produtos"); //retorna lista de produtos compraveis
Route.get("/vendas/pedidos", "WEB/VendaController.Show"); //retorna todos os pedidos de venda da filial
Route.get("/vendas/pedidos/detalhes/:serie/:pvc", "WEB/VendaController.See"); //retorna os detalhes de dado pedido
Route.get("/vendas/pedidos/detalhes/DOCS/:doctype/:serie/:pvc", "WEB/VendaController.RecoverDocs"); //retorna a DANFE solicitada
Route.post("/vendas/vender", "WEB/VendaController.Store"); //registra a venda
Route.put("/vendas/pedidos/atualizar/:pvc", "WEB/VendaController.Update"); //Cancela pedido de venda
Route.put("/vendas/pedidos/cancelar/:serie/:pvc", "WEB/VendaController.CancelVenda"); //Cancela pedido de venda
Route.put("/vendas/pedidos/faturar/:serie/:pvc", "WEB/VendaController.RequestNFeGeneration"); //Cancela pedido de venda

//Solicitação de equipamentos
Route.get("/equip/adresses", "WEB/EquipRequestController.See"); //retorna endereços, máquinas, configurações
Route.get("/equip/requests", "WEB/EquipRequestController.Show"); //retorna todas as requisições do grupo
Route.get("/equip/default/:id","WEB/EquipRequestController.SearchDefaultConfig"); //busca as configurações padrão da máquina
Route.get("/equip/requests/retrive", "WEB/EquipRequestController.RetriveOS"); //retorna o PDF da OS
Route.post("/equip", "WEB/EquipRequestController.Store"); //Solicita maquina

//Administração das Solicitações de Equipamento
Route.get("/equip/requests/all", "WEB/EquipRequestController.All"); //retorna todas as requisições do grupo
Route.put("/equip/requests/check", "WEB/EquipRequestController.ViewCheck"); //atualiza a data de visualização
Route.put("/equip/requests/validate", "WEB/EquipRequestController.ValidateOS"); //atualiza a configuração da maquina
Route.put("/equip/requests/admin", "WEB/EquipRequestController.SistemOptions"); //gerencia a os

//Franquia
Route.get("/administrar/franquia", "ADMIN/FranquiasController.Show");

//Formulário de futuros franqueados
Route.get("/form", "ADMIN/FuturoFranqueadoController.FutureCod"); //checa se o número do futuro franqueado existe no DB
Route.post("/form/solicitacao", "ADMIN/FuturoFranqueadoController.RequestCod"); //solicita código de acesso
Route.post("/form/upload", "ADMIN/FuturoFranqueadoController.FileUpload"); //faz upload de arquivos
Route.post("/form", "ADMIN/FuturoFranqueadoController.FormUpload"); //faz upload do formulario
Route.get("/form/original", "ADMIN/FuturoFranqueadoController.RetriveWORDFORM"); //baixa o formulario .doc
Route.get("/form/all", "ADMIN/FuturoFranqueadoController.Show"); //retorna todos os formulários

Route.get("/SLAPLIC/ATT", "MODS/SLaplicIntController.AttSLAPLIC"); //baixa a versão mais recente do SLAplic
Route.get("/testar", "ADMIN/ConsultorController.GeraTabelaExcel");
