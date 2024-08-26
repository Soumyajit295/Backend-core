class ApiError extends Error{
    constructor(statuCode,message="Something went wrong"){
        super(message)
        this.statuCode = statuCode
        this.message = message
        this.success = false
    }
}

export default ApiError