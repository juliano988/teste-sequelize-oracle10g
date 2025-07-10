import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("usuarios")
export class Usuario {
  @PrimaryGeneratedColumn({ type: "number", name: "id" })
  id!: number;

  @Column({ type: "varchar2", length: 100, nullable: false })
  nome!: string;

  @Column({ type: "varchar2", length: 200, unique: true })
  email!: string;

  @CreateDateColumn({ type: "date", name: "data_criacao" })
  dataCriacao!: Date;
}
