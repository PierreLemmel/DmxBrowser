export class Enttec {
    static vendorId = 0x403; //1027
    static openDmxProductId = 0x6001; //24577

    static async isEnttecOpenDmx(sp: SerialPort): Promise<boolean> {
        const info = await sp.getInfo();
        return info.usbVendorId === Enttec.vendorId && info.usbProductId === Enttec.openDmxProductId;
    }
}

export class OpenDmxDevice {
    
    private readonly _port: SerialPort;
    private readonly _buffer;
    

    constructor(port: SerialPort) {
        this._port = port;
        this._buffer = Buffer.alloc(513);
    }

    private _opened: boolean = false;
    get opened(): boolean {
        return this._opened;
    }

    private _loopbackInterval: NodeJS.Timeout|null = null;
    get isSending(): boolean {
        return this._loopbackInterval !== null;
    }

    private _refreshRate = 10.0;
    get refreshRate(): number {
        return this._refreshRate;
    }


    async open(): Promise<void> {

        const openOptions: OpenPortOptions = {
            baudRate: 250000,
            dataBits: 8,
            stopBits: 2,
            parity: "none",
            flowControl: "none"
        };

        await this._port.open(openOptions);

        this._opened = true;
    }

    async close(): Promise<void> {
        await  this._port.close();
        this._opened = false;
    }

    startSending(): void {
        this._loopbackInterval = setInterval(() => {
            this.sendFrame();
        }, 1000 / this._refreshRate)
    }

    setChannel(channel: number, value: number){
        this._buffer[channel] = value;
    }

    private async sendFrame(): Promise<void> {

        if (this._port.writable.locked) {
            return;
        }

        const writer = this._port.writable.getWriter();

        await this._port.setSignals({break: true, requestToSend: false});
        await this._port.setSignals({break: false, requestToSend: false});
        await writer.write(this._buffer);

        writer.releaseLock();
    }

    stopSending(): void {
        
        if (this._loopbackInterval !== null) {
            clearInterval(this._loopbackInterval);
            this._loopbackInterval = null;
        }
    }
}