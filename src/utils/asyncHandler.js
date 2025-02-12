const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(res, req, next)).
        catch((err)=> next(err))
    }
}

export { asyncHandler };


// try catch block method

// const asyncHandler = (requestHandler) => 
// async (req, res, next) => {
//     try {
//         await requestHandler(res, req, next);
//     } catch (error){
//         res.status(err.code || 500).
//         json({
//             success: false, 
//             message: err.message
//         })
//     }
// }