import {Container, Table, Button, Badge} from "react-bootstrap";
import {useEffect, useState} from "react";
import apiClient from "../../infrastructure/ApiClient";

const roleColors: any = {
    admin: "danger",
    teacher: "warning",
    student: "secondary"
};
const normalizeUser = (u: any) => ({
    ...u,
    roles: Array.isArray(u.roles) && u.roles.length > 0
        ? u.roles
        : ["student"]
});

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const AVAILABLE_ROLES = ["student", "teacher", "admin"] as const;
    type Role = typeof AVAILABLE_ROLES[number];
    useEffect(() => {
        apiClient.get("/admin/users").then(res =>
            setUsers(res.data.users.map(normalizeUser))
        );
    }, []);

    const updateRoles = (id: string, roles: string[]) => {
        apiClient.put(`/admin/users/${id}/roles`, { roles }).then(() =>
            setUsers(prev =>
                prev.map(u =>
                    u._id === id
                        ? { ...u, roles: roles.length ? roles : ["student"] }
                        : u
                )
            )
        );
    };


    return (
        <Container className="my-5">
            <h1 className="page-title">Admin Dashboard</h1>

            <Button
                className="btn-warning mb-4"
                onClick={() => apiClient.post("/admin/ai/retrain")}
            >
                Retrain AI Models
            </Button>

            <Table striped bordered hover>
                <thead>
                <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {users.map(u => (
                    <tr key={u._id}>
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td>
                            {u.roles.map((r: Role) => (
                                <Badge key={r} bg={roleColors[r] ?? "secondary"} className="me-1">
                                    {r}
                                </Badge>
                            ))}
                        </td>

                        <td>
                            <select
                                multiple
                                className="form-select form-select-sm"
                                value={u.roles}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                                    updateRoles(u._id, selected);
                                }}
                            >
                                {AVAILABLE_ROLES.map(role => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </td>

                    </tr>
                ))}
                </tbody>
            </Table>
        </Container>
    );
}
