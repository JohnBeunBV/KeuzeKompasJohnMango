import { Container, Card } from "react-bootstrap";
import { useEffect, useState } from "react";
import apiClient from "../../infrastructure/ApiClient";


export default function TeacherPage() {
    const [students, setStudents] = useState<any[]>([]);

    useEffect(() => {
        apiClient.get("/teacher/students").then(res =>
            setStudents(res.data.students)
        );
    }, []);

    return (
        <Container className="my-5">
            <h1 className="page-title">Teacher Dashboard</h1>

            <div className="card-container">
                {students.map(s => (
                    <Card key={s._id} className="vkm-card">
                        <h4>{s.username}</h4>
                        <p>{s.email}</p>
                        <p><strong>Favorites:</strong> {s.favorites?.length ?? 0}</p>
                    </Card>
                ))}
            </div>
        </Container>
    );
}
