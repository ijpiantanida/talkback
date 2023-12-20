import { Logger } from "../logger";
import { Options } from "../options";
import Tape from "../tape";

export class SequenceManager {
    nextSequenceNumber: number;
    private options: Options;
    private logger: Logger;

    constructor(options: Options) {
        this.options = options
        this.nextSequenceNumber = 1;

        this.logger = Logger.for(this.options)
    }

    reset(): void {
        this.logger.debug("Resetting nextSequenceNumber to 1")
        this.nextSequenceNumber = 1;
        
    }

    next(): number {
        this.logger.debug(`Advancing nextSequenceNumber to ${this.nextSequenceNumber}`)
        return this.nextSequenceNumber++
    }

    decorate(newTape: Tape) {
        newTape.meta.sequenceNumber = String(this.nextSequenceNumber)
    }
}