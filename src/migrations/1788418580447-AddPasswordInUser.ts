import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordInUser1788418580447 implements MigrationInterface {
    name = 'AddPasswordInUser1788418580447'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "password" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
    }

}
