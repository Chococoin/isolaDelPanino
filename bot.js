'use strict'

const Telegraf = require('telegraf')
const fs = require('fs')
// const mySql = require('mysql2')
// const Mail = require('@sendgrid/mail')
const { Markup } = Telegraf

const telegramApiKey = fs.readFileSync(".telegramApiKey").toString().trim()
const PAYMENT_TOKEN = fs.readFileSync(".stripeApiKey").toString().trim()

// const db = mySql.createPool({
//     host: "",
//     user: "",
//     database: "",
//     password: ""
// })

const app = new Telegraf(telegramApiKey)

const products = [
    {
        name: 'Piadina Sexy',
        price: 5.00,
        description: 'Piadina super hot e super express. Rucola, Steak, Pomodoro',
        photoUrl: 'https://i.ibb.co/PMXm52b/panini-676912-640.jpg'
    },
    {
        name: 'Hamburger Miraggio',
        price: 6.00,
        description: '200 gr carne di manzo, insalata, ouva fritta, avocato, formaggio Cheddar',
        photoUrl: 'https://i.ibb.co/c1Kw7hd/burger-1835192-640.jpg'
    },
    {
        name: 'Cocacola Bottiglia',
        price: 3.50,
        description: 'Bottiglia di coca-cola fresca di 1.5lt',
        photoUrl: 'https://i.ibb.co/Xz0Ls2P/cocacola1-5lt.jpg'
    }
]

function createInvoice (product) {
    return {
        provider_token: PAYMENT_TOKEN,
        start_parameter: 'foo',
        title: product.name,
        description: product.description,
        currency: 'EUR',
        photo_url: product.photoUrl,
        is_flexible: false,
        need_shipping_address: false,
        prices: [{ label: product.name, amount: Math.trunc(product.price * 100) }],
        payload: {}
    }
}

// Start command
app.command('start', ({ reply }) => {
    reply('Premi \/inizio per attivare il Robot della Isola del Panino.')
})

app.command('inizio', ({ reply }) => reply('Bevenuto! Io sono robot della isola del panino.Cosa vorresti mangiare oggi? \/menu'))
app.command('aiuto', ({ reply }) => reply('Ordina il panino che vuoi non ti lo portiamo a casa. Scrivi ho fame per vedere il nostro menu. Ricorda che al chiosco di Tony abbiamo molto alto da offrire. Domanda per il capitano Massimo! \/menu'))
app.command('menu', ({ replyWithMarkdown }) => replyWithMarkdown(
    `Non ti preocupare, nella isola del Panino tutti vivono sazi e contenti. Ecco il nostro menu. 
     ${products.reduce((acc, p) => { return (acc += `*${p.name}* - ${p.price} €\n`)
     }, '')} Ordina e mangia`, Markup.keyboard(products.map(p => p.name)).oneTime().resize().extra()
))

// Show offer
app.hears(/^Ho fame*/i, ({ replyWithMarkdown }) => replyWithMarkdown(
    `Non ti preocupare, nella isola del Panino tutti vivono sazi e contenti. Ecco il nostro menu. 
     ${products.reduce((acc, p) => { return (acc += `*${p.name}* - ${p.price} €\n`)
     }, '')} Ordina e mangia`, Markup.keyboard(products.map(p => p.name)).oneTime().resize().extra()
))



// Order product
products.forEach(p => {
    app.hears(p.name, (ctx) => {
        console.log(`${ctx.from.first_name} sta ordinando un/a ${p.name}.`)
        ctx.replyWithInvoice(createInvoice(p))
    })
})

// Handle payment callbacks
app.on('pre_checkout_query', ({ answerPreCheckoutQuery }) => answerPreCheckoutQuery(true))
app.on('successful_payment', (ctx) => {
    console.log(`${ctx.from.first_name} (${ctx.from.username}) ha pagato ${ctx.message.successful_payment.total_amount / 100} €.`)
})

app.command('location', (ctx) => {
    console.log(ctx.update.message)
})

app.startPolling()
