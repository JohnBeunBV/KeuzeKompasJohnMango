import { Container, Table, Button, Badge } from "react-bootstrap";
import { useEffect, useState } from "react";
import apiClient from "../../infrastructure/ApiClient";

const roleColors: any = {
    admin: "danger",
    teacher: "warning",
    student: "secondary"
};

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        apiClient.get("/admin/users").then(res => setUsers(res.data.users));
    }, []);

    const updateRoles = (id: string, roles: string[]) => {
        apiClient.put(`/admin/users/${id}/roles`, { roles }).then(() =>
            setUsers(prev =>
                prev.map(u => u._id === id ? { ...u, roles } : u)
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
                            {u.roles.map((r: string) => (
                                <Badge key={r} bg={roleColors[r]} className="me-1">
                                    {r}
                                </Badge>
                            ))}
                        </td>
                        <td>
                            <Button
                                size="sm"
                                className="btn-secondary"
                                onClick={() => updateRoles(u._id, ["teacher"])}
                            >
                                Make Teacher
                            </Button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>
        </Container>
    );
}
