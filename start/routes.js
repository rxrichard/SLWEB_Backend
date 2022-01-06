"use strict";

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use("Route");

//TESTE
Route.get("/", function () {
  return { message: "API Funcionando!" };
})

//Integração com API TOTVS
Route.get("/tel/update/:filial/:equicod", "MODS/Sl2TelController.Update");
Route.get("/mifix/consulta/ativo/:ativo", "MODS/Sl2TelController.Show");
Route.get("/ativo/qrcode/:ativo", "MODS/SLaplicIntController.ReturnQRCode");

//Disparar Emails
Route.get("/emails/history", "ADMIN/MailerController.Show").middleware('jwt')
Route.get("/emails/recipients/:model", "ADMIN/MailerController.See").middleware('jwt')

//Sessão
Route.post("/auth", "UserController.Login");
Route.post("/forgot", "UserController.Forgot");
Route.post("/admAuth/full", "UserController.AdmFullLogin");
Route.post("/admAuth/partial", "UserController.AdmPartialLogin");
Route.post("/checkAuth", "UserController.ExternalAuth");

//Usuário
Route.get("/profile", "WEB/ProfileController.Show").middleware('jwt');
Route.put("/profile/password", "WEB/ProfileController.ChangePassword").middleware('jwt');
Route.put("/profile/email", "WEB/ProfileController.ChangeEmail").middleware('jwt');
Route.put("profile/tax", "WEB/ProfileController.ChangeTax").middleware('jwt');

//Leads
Route.get("/leads", "WEB/LeadController.Show").middleware('jwt');
Route.get("/leads/:lead", "WEB/LeadController.See").middleware('jwt');
Route.put("/leads", "WEB/LeadController.Update").middleware('jwt');
Route.post("/leads", "WEB/LeadController.Store").middleware('jwt');

//Clientes
Route.post("/client/details", "WEB/ClientController.See").middleware('jwt'); //mostra contagem de dados
Route.get("/client", "WEB/ClientController.Show").middleware('jwt'); //retorna clientes
Route.post("/client/new", "WEB/ClientController.Store").middleware('jwt'); //adicionar cliente
Route.put("/client/update", "WEB/ClientController.Update").middleware('jwt'); //atualiza cliente
Route.delete("/client/delete", "WEB/ClientController.Destroy").middleware('jwt'); //apagar cliente?

//Compras
Route.get("/compras/produtos", "WEB/CompraController.Produtos").middleware('jwt'); //retorna lista de produtos compraveis
Route.get("/compras/contas", "WEB/CompraController.Contas").middleware('jwt'); //retorna lista de produtos compraveis
Route.get("/compras/pedidos", "WEB/CompraController.Pedidos").middleware('jwt'); //retorna pedidos atendidos e abertos do cliente
Route.get("/compras/pedidos/detalhes/:ID/:STATUS", "WEB/CompraController.PedidoDet").middleware('jwt'); //retorna detalhes do pedido
Route.delete("/compras/pedidos/cancelar/:ID", "WEB/CompraController.Cancelar").middleware('jwt'); //retorna detalhes do pedido
Route.get("/compras/retriveboleto/:ID", "WEB/CompraController.RetriveBoleto").middleware('jwt'); //retorna o pdf do pedido
Route.get("/compras/retrivenfe/:ID", "WEB/CompraController.RetriveNota").middleware('jwt'); //retorna o pdf do pedido
Route.post("/compras/comprar", "WEB/CompraController.Comprar").middleware('jwt'); //retorna detalhes do pedido
Route.post("/compras/duplicatas/report/", "WEB/CompraController.Compensar").middleware('jwt'); //salva arquivo de duplicatas

//Vendas
Route.get("/vendas/produtos", "WEB/VendaController.Produtos").middleware('jwt'); //retorna lista de produtos compraveis
Route.get("/vendas/pedidos", "WEB/VendaController.Show").middleware('jwt'); //retorna todos os pedidos de venda da filial
Route.get("/vendas/pedidos/detalhes/:serie/:pvc", "WEB/VendaController.See").middleware('jwt'); //retorna os detalhes de dado pedido
Route.get("/vendas/pedidos/detalhes/DOCS/:doctype/:serie/:pvc", "WEB/VendaController.RecoverDocs").middleware('jwt'); //retorna a DANFE solicitada
Route.post("/vendas/vender", "WEB/VendaController.Store").middleware('jwt'); //registra a venda
Route.put("/vendas/pedidos/atualizar/:pvc", "WEB/VendaController.Update").middleware('jwt'); //Cancela pedido de venda
Route.put("/vendas/pedidos/cancelar/:serie/:pvc", "WEB/VendaController.CancelVenda").middleware('jwt'); //Cancela pedido de venda
Route.put("/vendas/pedidos/faturar/:serie/:pvc", "WEB/VendaController.RequestNFeGeneration").middleware('jwt'); //Cancela pedido de venda

//Equipamentos
Route.get("/equip", "WEB/EquipController.Show").middleware('jwt'); //retorna máquinas do franqueado
Route.put("/equip", "WEB/EquipController.Update").middleware('jwt'); //atualiza cliente da máquina
Route.get("/equip/reports", "WEB/EquipController.See").middleware('jwt'); //retorna reports do franqueado
Route.post("/equip/reports", "WEB/EquipController.StoreReport").middleware('jwt'); //cria report do franqueado
Route.put("/equip/reports", "WEB/EquipController.DeleteReport").middleware('jwt'); //fecha report do franqueado
Route.get("/equip/confirm/", "WEB/EquipController.SeeConfirmInfo").middleware('jwt'); // retorna a lista de endereços a serem confirmados
Route.post("/equip/confirm/", "WEB/EquipController.ConfirmAddresses").middleware('jwt'); // grava o cnpj dos clientes com as máquinas

//Solicitação de equipamentos
Route.get("/equip/requests/own", "WEB/EquipRequestController.Show").middleware('jwt'); //retorna todas as requisições do grupo
Route.get("/equip/requests/adresses", "WEB/EquipRequestController.See").middleware('jwt'); //retorna endereços, máquinas, configurações
Route.get("/equip/requests/default/:id", "WEB/EquipRequestController.SearchDefaultConfig").middleware('jwt'); //busca as configurações padrão da máquina
Route.get("/equip/requests/retrive", "WEB/EquipRequestController.RetriveOS").middleware('jwt'); //retorna o PDF da OS
Route.post("/equip/requests", "WEB/EquipRequestController.Store").middleware('jwt'); //Solicita maquina

//Administração das Solicitações de Equipamento
Route.get("/equip/requests/all", "WEB/EquipRequestController.All").middleware('jwt'); //retorna todas as requisições do grupo
Route.put("/equip/requests/check", "WEB/EquipRequestController.ViewCheck").middleware('jwt'); //atualiza a data de visualização
Route.put("/equip/requests/validate", "WEB/EquipRequestController.ValidateOS").middleware('jwt'); //atualiza a configuração da maquina
Route.put("/equip/requests/admin", "WEB/EquipRequestController.SistemOptions").middleware('jwt'); //gerencia a os

//Franquia
Route.get("/administrar/franquia", "ADMIN/FranquiasController.Show").middleware('jwt');

//Formulário de futuros franqueados
Route.get("/form", "ADMIN/FuturoFranqueadoController.FutureCod"); //checa se o número do futuro franqueado existe no DB
Route.post("/form/solicitacao", "ADMIN/FuturoFranqueadoController.RequestCod"); //solicita código de acesso
Route.post("/form/upload", "ADMIN/FuturoFranqueadoController.FileUpload"); //faz upload de arquivos
Route.post("/form", "ADMIN/FuturoFranqueadoController.FormUpload"); //faz upload do formulario
Route.get("/form/original", "ADMIN/FuturoFranqueadoController.RetriveWORDFORM"); //baixa o formulario .doc
Route.get("/form/all", "ADMIN/FuturoFranqueadoController.Show").middleware('jwt'); //retorna todos os formulários
Route.get("/form/pdf/:formcod", "ADMIN/FuturoFranqueadoController.GeneratePDF").middleware('jwt'); //retorna pdf do formulario

//Dashboard
Route.get("/dashboard/telemetrias", "WEB/DashboardController.Telemetrias").middleware('jwt'); //retorna pdf do formulario
Route.get("/dashboard/filiais", "WEB/DashboardController.Filiais").middleware('jwt'); //retorna pdf do formulario
Route.post("/dashboard/telemetrias/chamado", "WEB/DashboardController.AbrirChamado").middleware('jwt'); //retorna pdf do formulario

//Consulta Coletas
Route.get("/coletas", "WEB/ConsultaColetasController.Show").middleware('jwt'); //retorna todas as coletas do franqueado
Route.get("/coletas/detalhes/:anxid/:pdvid/:fseq", "WEB/ConsultaColetasController.See").middleware('jwt'); //retorna todas as coletas do franqueado
Route.get("/coletas/historico/:equicod/:anxid", "WEB/ConsultaColetasController.NovaColetaOptions").middleware('jwt'); //retorna info sobre a última coleta do eq
Route.get("/coletas/novacoleta/:l1id/:l2id/:anxid/:pdvid", "WEB/ConsultaColetasController.CalcColetas").middleware('jwt'); //retorna qtd de doses em x tempo

//quebra galho
Route.get("/SLAPLIC/ATT", "MODS/SLaplicIntController.AttSLAPLIC"); //baixa a versão mais recente do SLAplic
Route.get("/testar", "ADMIN/ConsultorController.GeraTabelaExcel").middleware('jwt'); //cria a planilha que a cris pediu
