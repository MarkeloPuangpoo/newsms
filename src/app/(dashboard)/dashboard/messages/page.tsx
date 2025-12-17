
import { getContactList } from "@/lib/actions/chat";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Please log in.</div>;

    const contacts = await getContactList();

    return (
        <div className="h-full flex flex-col">
            <DashboardHeader title="Messages" description="Chat with your students and colleagues." />
            <ChatInterface initialContacts={contacts} currentUserId={user.id} />
        </div>
    );
}
