const mongoose = require("mongoose");
const { Schema } = mongoose;



const subscriptionSchema = new Schema({
    subscriber: {
    // the user who is SUBSCRIBING (the one clicking "subscribe")
    type: Schema.Types.ObjectId,
    ref: "User"
    },
    channel: {
      // the user who is BEING SUBSCRIBED TO (the channel owner)
      type: Schema.Types.ObjectId,
      ref: "User"
    }
},{ timestamps: true })

const Subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = { Subscription };