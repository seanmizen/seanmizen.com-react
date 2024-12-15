import Fastify from "fastify";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import { Server, IncomingMessage, ServerResponse } from "http";
import Stripe from "stripe";
import { configs } from "../configs";
import { randomUUID } from "crypto";

const config = configs[process.env.NODE_ENV || "development"];
const appDomain = config.appBasename; // "http://localhost:4000" or "https://seanscards.com"

const stripe = new Stripe(
  "sk_test_51QVX2JBsGhYF8YEWi3iM9PCLwFMG2AMbKx1eq6L4mPMp6TB62S9tve5NypbQmeiTTJ9epEAJhaO01lTLOZI4Huxy0009gNLP2Z"
);

const fastify = Fastify<Server, IncomingMessage, ServerResponse>({
  logger: { level: "error" },
});

fastify.register(cors);
fastify.register(formbody);
fastify.register(cookie, {
  secret: "super", // for cookies signature
  hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
  parseOptions: {}, // options for parsing cookies
});
fastify.register(jwt, { secret: "super" });

// fastify.register(routes);
fastify.get("/api", async (request, reply) => {
  console.debug("we hello-worlding", request.headers);
  return { hello: "world" };
});

fastify.post("/api/create-checkout-session", async (request, reply) => {
  console.debug("create-checkout-session", request.headers);
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    line_items: [
      {
        // "prod_ROSpFjN63ZsvCY",
        price: "price_1QVfu2BsGhYF8YEWBId3mVNi",
        quantity: 1,
      },
    ],
    mode: "payment",
    return_url: `${appDomain}/return?session_id={CHECKOUT_SESSION_ID}`,
    automatic_tax: { enabled: true },
  });

  reply.send({ clientSecret: session.client_secret });
});

// const calculateOrderAmount = (items) => {
//   // Calculate the order total on the server to prevent
//   // people from directly manipulating the amount on the client
//   let total = 0;
//   items.forEach((item) => {
//     total += item.amount;
//   });
//   return total;
// };

// interface PaymentIntentRequestBody {
//   items: { amount: number }[];
// }

// fastify.post("/api/create-payment-intent", async (request, reply) => {
//   const { items } = request.body as PaymentIntentRequestBody;

//   // Create a PaymentIntent with the order amount and currency
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: calculateOrderAmount(items),
//     currency: "gbp",
//     // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
//     automatic_payment_methods: {
//       enabled: true,
//     },
//   });

//   reply.send({
//     clientSecret: paymentIntent.client_secret,
//     // [DEV]: For demo purposes only, you should avoid exposing the PaymentIntent ID in the client-side code.
//     dpmCheckerLink: `https://dashboard.stripe.com/settings/payment_methods/review?transaction_id=${paymentIntent.id}`,
//   });
// });

fastify.get("/api/session-status", async (request, reply) => {
  const session = await stripe.checkout.sessions.retrieve(
    (request.query as unknown as any).session_id
  );

  reply.send({
    status: session.status,
    customer_email: session.customer_details?.email,
  });
});

fastify.get("/api/session-token", async (request, reply) => {
  // BE does not care nor store sessions. this is an FE responsibility
  reply.send(randomUUID());
});

// method: "POST",
// headers: {
//   "Content-Type": "application/json",
// },
// body: JSON.stringify({
//   sessionToken,
//   ...formik.values,
// }),
// })
// .then((res) => res.json())
// .then((data) => {
//   console.log("form response:", data);
// })
// .catch((error) => {
//   console.error("Error submitting form:", error);
// });

// update-session-fields
type FormShape = {
  message: string;
  address: string;
  email: string;
  // plus sessionToken! (string)
};

fastify.post("/api/update-session-fields", async (request, reply) => {
  const { sessionToken, ...fields } = request.body as FormShape & {
    sessionToken: string;
  };

  // BE does not care nor store sessions. this is an FE responsibility
  console.log("sessionToken", sessionToken);
  console.log("fields", fields);

  reply.send({ status: "ok" });
});

const reset = "\x1b[0m";
const cyan = "\x1b[36m";
const dim = "\x1b[2m%s";
const bright = "\x1b[1m";

const start = async () => {
  const port = 4242;
  try {
    await fastify.listen({
      port,
    });
    console.debug(
      "Bun serving at",
      [cyan, "http://localhost:", bright, port, reset].join("")
    );
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
