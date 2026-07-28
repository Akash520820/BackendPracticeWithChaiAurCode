const { Subscription } = require("../models/subscription.model.js");
const { User } = require("../models/user.model.js");

const getUserChannelProfile = asyncHandler(async (req, res) => {

    // ---- STEP 1: Get the username from the URL ----
    // e.g. route: /subscriptions/c/:username  (or wherever you mount this)
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            // ---- STAGE 1: Find the ONE user whose channel this is ---- here we already filtered the users collection to find the one user whose userName matches the URL
            $match: {
                userName: username.toLowerCase()
            }

        },
        {
            // ---- STAGE 2: Get everyone who subscribes to THIS user ----
            // i.e. every subscription doc where "channel" == this user's _id
            $lookup: {
                from: "subscriptions",
                localField: "_id", // this id refers the username(who won the channel) which i find in first step
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            // ---- STAGE 3: Get every channel THIS user subscribes to ----
            // i.e. every subscription doc where "subscriber" == this user's _id
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            // ---- STAGE 4: Compute derived fields from the two lookups above ----
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                // ---- Is the CURRENTLY LOGGED-IN user subscribed to this channel? ----
                // $in checks if req.user._id exists inside the "subscriber" field
                // of any document in the "subscribers" array we joined above.
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            // ---- STAGE 5: Only send back the fields the frontend actually needs ----
            $project: {
                userName: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                email: 1
            }
        }
    ])

    // ---- STEP 6: Aggregate always returns an array — handle "channel not found" ----
    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))
});

module.exports = {
    getUserChannelProfile
};