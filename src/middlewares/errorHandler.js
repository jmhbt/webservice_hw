module.exports = function errorHandler(err,req,res,next){
    console.error("Internal Server Error:", err);

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err.type === "SERVICE_UNAVAILABLE"){
        statusCode = 503;
        message = "Service temporarily unavailable";
    }

    if (statusCode === 503) {
        res.set("Retry-After", "10");
    }

    res.status(statusCode).json({
        status: "error",
        data:null,
        message,
    });
};