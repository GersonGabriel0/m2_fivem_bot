const env = require('../.env')
const common = require('../common.env')
const { Telegraf, Markup } = require('telegraf')
const fetch = require("node-fetch")
const LocalSession = require('telegraf-session-local')
const request = require('request')

const armas = common.armas;
var cargos = common.cargos;
const actions = ['Listar Cargo', 'Cadastrar nova Cargo',  'Excluir Cargo', 'Atualizar Cargo']

const bot = new Telegraf(env.token)

var apiToken = '';

bot.use(new LocalSession({ database: 'fivem_db.json' }).middleware())

async function updateAPIToken() {
    var body = {
        email: env.apicredentials.email, 
        password: env.apicredentials.password
    }
    fetch(env.apiBase + '/users/login', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => res.json())
        .then(json => apiToken = json.token)
        .catch (err => console.log(err))
}

updateAPIToken();

async function createArmamanetocargo(nome, cargo) {
    updateAPIToken();
    var body = {
        nome: nome,
        cargo: cargo
    }
    var response;
    fetch(env.apiBase + '/armamanetocargos', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': apiToken
        }
    }).then(res => res.json())
        .then(json => response = json)
        .catch (err => console.log(err))
    return await response;
}

async function updateArmamanetocargo(id, cargo) {
    updateAPIToken();
    var body = {
        cargo: cargo
    }
    var response;
    fetch(env.apiBase + '/armamanetocargos/' + id, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': apiToken
        }
    }).then(res => res.json())
        .then(json => response = json.message)
        .catch (err => console.log(err))
    return await response;
}

bot.start(async ctx => {
    const from = ctx.update.message.from
    await ctx.reply(`Seja bem vindo ${from.first_name}`)
    await ctx.reply(
        `Eu fui desenvolvido pelo GERSON GABRIEL E GABRIEL KWIATKOWSKI`,
        Markup.keyboard(armas).resize().oneTime()
    )
})

bot.hears(armas, async ctx => {
    updateAPIToken();
    await ctx.reply(` Legal! Para qual cargo você e? `)
    var message = ctx.message.text
    request(`${env.apiHcargos}/${message}`, async (err, res, body) => {
        var response = JSON.parse(body)
        var keyboardvalues = []
        response.forEach(element => {
            keyboardvalues.push(element.nome)
        });
        await ctx.reply(
            `Aqui estão todos os cargos:`,
            Markup.keyboard(keyboardvalues).resize().oneTime()
        )}
    )
})

 

bot.hears(cargos, async ctx => {
    var currentcargo = ctx.update.message.text
    ctx.session.currentcargo = currentcargo;
    ctx.session.action = 'create';
    await ctx.reply('Gostei! E qual foi o cargo?')
})

let list = []

const itemsButtons = () =>
    Markup.inlineKeyboard(
    list.map(item => Markup.button.callback(item, `remove ${item}`)),
    { columns: 3 }
)

const onlyNumbers = new RegExp('^[0-9]+$')

bot.hears(onlyNumbers, async ctx => {
    var message = ctx.update.message.text
    if (message.length === 4) {
        var action = ctx.session.action;
    
        switch (action) {
            case 'create':
                list.push(ctx.update.message.text)
                console.log(list)
                var currentcargo = ctx.session.currentcargo
                var year = ctx.update.message.text
                var userID = ctx.update.message.from.id
                var nome = ctx.update.message.from.first_name
    
                await createArmamanetocargo(userID, currentcargo, year, nome)
    
                ctx.reply(
                    `O Cargo ${currentcargo} a(o) ${ctx.update.message.text} foi adicionada à lista! O que deseja fazer agora?`,
                    Markup.keyboard(actions).resize().oneTime(),
                    itemsButtons()
                )
                ctx.session.currentcargo = null;
                ctx.session.action = null;
                break;
            case 'update':
                armamanetocargoID = ctx.session.currentarmamanetocargo;
                var year = ctx.update.message.text
                await updateArmamanetocargo(armamanetocargoID, year);
                ctx.reply(
                    `O Cargo foi alterada com sucesso! O que deseja fazer agora?`,
                    Markup.keyboard(actions).resize().oneTime(),
                    itemsButtons()
                )
                ctx.session.currentarmamanetocargo = null;
                ctx.session.action = null;
                break;
            default:
                ctx.session.currentcargo = null;
                ctx.session.currentarmamanetocargo = null;
                ctx.session.action = null;
                ctx.reply(
                    `Não entendi!! o que devemos fazer agora?`,
                    Markup.keyboard(actions).resize().oneTime(),
                    itemsButtons()
                )
                break;
        }
    } else {
        ctx.reply(
            `Por gentileza, digite um cargo valido`
        )
    }
})
     
bot.action(/remove (.+)/, ctx => {
    var id = ctx.match[1]

    fetch(env.apiBase + '/armamanetocargos/' + id, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': apiToken
        }
    }).then(res => res.json())
    .then((json) => {

        ctx.reply(
            `O Cargo foi removida da sua lista!`,
            Markup.keyboard(actions).resize().oneTime(),
            itemsButtons()
        )
    })
})

bot.action(/update (.+)/, ctx => {
    var id = ctx.match[1]

    ctx.session.currentarmamanetocargo = id;
    ctx.session.action = 'update';

    ctx.reply('Para qual Cargo você gostaria de alterar?')
})

bot.hears('Cadastrar novo Cargo',
ctx => {
    ctx.reply( 'Para qual cargo voce vai?',
    Markup.keyboard(armas).resize().oneTime()
)})
  
bot.hears('Listar Cargos',ctx => {
    updateAPIToken();
    var userID = ctx.update.message.from.id

    fetch(env.apiBase + '/armamanetocargos/' + userID, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': apiToken
        }
    }).then(res => res.json())
    .then((json) => {

        const myArmamanetocargos = () =>
        Markup.inlineKeyboard(
            json.map(
                item => Markup.button.callback(item.hcargo + ' - ' + item.ano, `${item.hcargo}`)
            ),
            { columns: 2 }
        )
    
        ctx.reply(
            'Aqui estão todas os seus cargos cadastradas:',
            myArmamanetocargos()
        ).then(() => {
            ctx.reply(
                'O que devemos fazer agora?',
                Markup.keyboard(actions).resize().oneTime(),
                itemsButtons()
            )
        })
        
    })
    .catch (err => console.log(err))
    
})

bot.hears('Excluir Cargo',ctx => {
    var userID = ctx.update.message.from.id
  
    fetch(env.apiBase + '/armamanetocargos/' + userID, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': apiToken
        }
    }).then(res => res.json())
    .then((json) => {

        var myArmamanetocargos = () => Markup.inlineKeyboard(
            json.map(
                item => Markup.button.callback(item.hcargo + ' - ' + item.ano, `remove ${item.id}`)
            ),
            { columns: 2 }
        )
        

        ctx.reply(
            'Clique sobre um dos cargos da sua lista para excluir. Essa ação não podera ser desfeita.',
            myArmamanetocargos()
        )
    })
})

bot.hears('Atualizar cargos',ctx => {
    var userID = ctx.update.message.from.id
  
    fetch(env.apiBase + '/armamanetocargos/' + userID, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': apiToken
        }
    }).then(res => res.json())
    .then((json) => {

        var myArmamanetocargos = () => Markup.inlineKeyboard(
            json.map(
                item => Markup.button.callback(item.hcargo + ' - ' + item.ano, `update ${item.id}`)
            ),
            { columns: 2 }
        )
        

        ctx.reply(
            'Clique sobre um dos cargos da sua lista para alterar. Essa ação não será desfeita.',
            myArmamanetocargos()
        )
    })
})


bot.startPolling()