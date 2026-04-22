create table business_information (
    id varchar(64) primary key,
    entity_name varchar(255) not null,
    address varchar(512) not null,
    control_number varchar(128) not null,
    company_status varchar(64) not null
);
