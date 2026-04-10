export interface IStatusDetail {
    is_active: boolean;
    text: string;
}

export interface IMaintenanceStatus extends IStatusDetail {
    estimation_duration: string;
}

export interface IPreMaintenanceStatus extends IStatusDetail {
    starting_date: string;
}

export interface IPublicBannerStatus extends IStatusDetail {
    type: string;
    link?: string;
}

export interface ISiteStatus {
    generated_at: string;
    maintenance?: IMaintenanceStatus;
    pre_maintenance?: IPreMaintenanceStatus;
    public_banner?: IPublicBannerStatus;
}
