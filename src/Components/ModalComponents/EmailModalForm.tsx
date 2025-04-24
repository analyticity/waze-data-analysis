import { Button, Form, Input, Modal, message } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { backendApi } from '../../utils/api';

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 8,
    },
  },
};

const EmailModalForm = ({ openEmailModal, setOpenEmailModal }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = (values: any) => {
    const data_email = {
      subject: values.subject,
      body: values.body,
      from_email: values.email,
    };
    backendApi
      .post('send_mail/', data_email)
      .then((response) => {
        messageApi.open({
          type: 'success',
          content: t('app.emailSend'),
          duration: 5,
          style: {
            marginTop: '8vh',
          },
        });
      })
      .finally(() => {
        setOpenEmailModal(false);
        values = null;
      });
  };

  return (
    <Modal
      open={openEmailModal}
      title={t('app.contactForm')}
      width={800}
      onCancel={() => setOpenEmailModal(false)}
      footer={null}
      className="modal"
    >
      <Form
        {...formItemLayout}
        form={form}
        name="contact form"
        onFinish={onFinish}
        scrollToFirstError
        style={{ maxWidth: 600 }}
      >
        {contextHolder}

        <Form.Item
          name="email"
          label={t('app.contactEmail')}
          rules={[
            {
              type: 'email',
              message: t('app.contactEmailNotValid'),
            },
            {
              required: true,
              message: t('app.contactEmailHint'),
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="subject"
          label={t('app.subject')}
          rules={[{ required: true, message: t('app.subjectHint'), whitespace: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="body" label={t('app.body')} rules={[{ required: true, message: t('app.bodyHint') }]}>
          <Input.TextArea showCount maxLength={1000} autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
        <Form.Item {...tailFormItemLayout} style={{ margin: 0 }}>
          <Button type="primary" htmlType="submit" className="modalButton">
            {t('app.send')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EmailModalForm;
